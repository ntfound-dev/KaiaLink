const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PointsMinter + SBT", function () {
  async function deployAll() {
    const [admin, alice] = await ethers.getSigners();

    const SBT = await ethers.getContractFactory("SBT");
    const sbt = await SBT.deploy(admin.address);
    await sbt.waitForDeployment();

    const PointsMinter = await ethers.getContractFactory("PointsMinter");
    const pm = await PointsMinter.deploy(await sbt.getAddress(), admin.address);
    await pm.waitForDeployment();

    // grant MINTER_ROLE to PointsMinter
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await sbt.grantRole(MINTER_ROLE, await pm.getAddress());

    // set levels (Bronze/Silver)
    await pm.setLevels([
      { minPoints: 1_000_000n, uri: "ipfs://bronze" },
      { minPoints: 2_000_000n, uri: "ipfs://silver" }
    ]);

    return { sbt, pm, admin, alice };
  }

  it("alice redeem bronze lalu upgrade ke silver", async () => {
    const { sbt, pm, admin, alice } = await deployAll();

    // backend set points ke 1e6
    await pm.connect(admin).setPoints(alice.address, 1_000_000n);
    // alice redeem -> mint bronze
    await pm.connect(alice).redeem();
    const tokenId = await sbt.sbtOf(alice.address);
    expect(tokenId).to.not.equal(0n);
    expect(await sbt.tokenURI(tokenId)).to.equal("ipfs://bronze");

    // backend tambah points ke 2e6 -> upgrade
    await pm.connect(admin).setPoints(alice.address, 2_000_000n);
    await pm.connect(alice).redeem();
    expect(await sbt.tokenURI(tokenId)).to.equal("ipfs://silver");
  });

  it("redeem tanpa cukup points harus revert", async () => {
    const { pm, alice } = await deployAll();
    await expect(pm.connect(alice).redeem()).to.be.revertedWithCustomError(pm, "NoEligibleLevel");
  });

  it("redeem tidak upgrade jika level tidak naik", async () => {
    const { sbt, pm, admin, alice } = await deployAll();
    await pm.connect(admin).setPoints(alice.address, 1_000_000n);
    await pm.connect(alice).redeem();
    const tokenId = await sbt.sbtOf(alice.address);
    expect(await sbt.tokenURI(tokenId)).to.equal("ipfs://bronze");

    // set points tetap bronze
    await pm.connect(admin).setPoints(alice.address, 1_500_000n);
    await expect(pm.connect(alice).redeem()).to.be.revertedWithCustomError(pm, "LevelNotIncreased");
  });
});