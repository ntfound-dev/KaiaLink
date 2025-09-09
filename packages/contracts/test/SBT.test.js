const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SBT", function () {
  async function deploy() {
    const [admin, alice, bob] = await ethers.getSigners();
    const SBT = await ethers.getContractFactory("SBT");
    const sbt = await SBT.deploy(admin.address);
    await sbt.waitForDeployment();
    return { sbt, admin, alice, bob };
  }

  it("mint pertama kali: 1 token per address, locked, tokenURI benar", async () => {
    const { sbt, admin, alice } = await deploy();

    await sbt.connect(admin).awardSBT(alice.address, "ipfs://bronze");
    const tokenId = await sbt.sbtOf(alice.address);

    expect(tokenId).to.not.equal(0n);
    expect(await sbt.tokenURI(tokenId)).to.equal("ipfs://bronze");
    expect(await sbt.locked(tokenId)).to.equal(true);
    expect(await sbt.supportsInterface("0xb45a3c0e")).to.equal(true); // IERC5192
  });

  it("tidak bisa mint 2x ke address yang sama", async () => {
    const { sbt, admin, alice } = await deploy();
    await sbt.connect(admin).awardSBT(alice.address, "ipfs://bronze");
    await expect(
      sbt.connect(admin).awardSBT(alice.address, "ipfs://silver")
    ).to.be.revertedWithCustomError(sbt, "AlreadyHasSBT");
  });

  it("batch mint dan validasi length mismatch", async () => {
    const { sbt, admin, alice, bob } = await deploy();
    await sbt.connect(admin).awardSBTBatch(
      [alice.address, bob.address],
      ["ipfs://bronze", "ipfs://silver"]
    );

    await expect(
      sbt.connect(admin).awardSBTBatch([alice.address], ["ipfs://bronze", "ipfs://silver"])
    ).to.be.revertedWithCustomError(sbt, "LengthMismatch");
  });

  it("transfer harus revert NonTransferable", async () => {
    const { sbt, admin, alice, bob } = await deploy();
    await sbt.connect(admin).awardSBT(alice.address, "ipfs://bronze");
    const tokenId = await sbt.sbtOf(alice.address);

    await expect(
      sbt.connect(alice).transferFrom(alice.address, bob.address, tokenId)
    ).to.be.revertedWithCustomError(sbt, "NonTransferable");

    await expect(
      sbt.connect(alice)["safeTransferFrom(address,address,uint256)"](alice.address, bob.address, tokenId)
    ).to.be.revertedWithCustomError(sbt, "NonTransferable");
  });

  it("approve/setApprovalForAll diblokir", async () => {
    const { sbt, admin, alice, bob } = await deploy();
    await sbt.connect(admin).awardSBT(alice.address, "ipfs://bronze");
    const tokenId = await sbt.sbtOf(alice.address);

    await expect(
      sbt.connect(alice).approve(bob.address, tokenId)
    ).to.be.revertedWithCustomError(sbt, "NonTransferable");

    await expect(
      sbt.connect(alice).setApprovalForAll(bob.address, true)
    ).to.be.revertedWithCustomError(sbt, "NonTransferable");
  });

  it("update tokenURI hanya oleh MINTER_ROLE", async () => {
    const { sbt, admin, alice, bob } = await deploy();
    await sbt.connect(admin).awardSBT(alice.address, "ipfs://bronze");
    const tokenId = await sbt.sbtOf(alice.address);

    await expect(
      sbt.connect(bob).updateTokenURI(tokenId, "ipfs://silver")
    ).to.be.revertedWithCustomError(sbt, "AccessControlUnauthorizedAccount");

    await sbt.connect(admin).updateTokenURI(tokenId, "ipfs://silver");
    expect(await sbt.tokenURI(tokenId)).to.equal("ipfs://silver");
  });

  it("renounce oleh owner dan revoke oleh MINTER_ROLE", async () => {
    const { sbt, admin, alice } = await deploy();
    await sbt.connect(admin).awardSBT(alice.address, "ipfs://bronze");
    const tokenId = await sbt.sbtOf(alice.address);

    // renounce oleh owner
    await sbt.connect(alice).renounce(tokenId);
    expect(await sbt.sbtOf(alice.address)).to.equal(0n);
    await expect(sbt.tokenURI(tokenId)).to.be.revertedWithCustomError(sbt, "ERC721NonexistentToken");

    // mint lagi, lalu revoke oleh minter
    await sbt.connect(admin).awardSBT(alice.address, "ipfs://bronze2");
    const tokenId2 = await sbt.sbtOf(alice.address);
    await sbt.connect(admin).revoke(tokenId2);
    expect(await sbt.sbtOf(alice.address)).to.equal(0n);
  });
});