import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("LinkaToken - Security & Edge Cases", function () {
  async function deployFixture() {
    const [deployer, admin, alice, bob, carol] = await ethers.getSigners();
    const LinkaToken = await ethers.getContractFactory("LinkaToken");
    const token = await LinkaToken.deploy(admin.address);
    await token.waitForDeployment();

    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();

    return { token, deployer, admin, alice, bob, carol, DEFAULT_ADMIN_ROLE, MINTER_ROLE };
  }

  it("mint ke address(0) harus revert (ERC20InvalidReceiver)", async function () {
    const { token, admin } = await loadFixture(deployFixture);
    const amount = ethers.parseUnits("1", 18);

    await expect(token.connect(admin).mint(ethers.ZeroAddress, amount))
      .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver")
      .withArgs(ethers.ZeroAddress);
  });

  it("transfer ke address(0) harus revert (ERC20InvalidReceiver)", async function () {
    const { token, admin, alice } = await loadFixture(deployFixture);
    const amount = ethers.parseUnits("10", 18);
    await token.connect(admin).mint(alice.address, amount);

    await expect(token.connect(alice).transfer(ethers.ZeroAddress, amount))
      .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver")
      .withArgs(ethers.ZeroAddress);
  });

  it("burn melebihi saldo harus revert (ERC20InsufficientBalance)", async function () {
    const { token, admin, alice } = await loadFixture(deployFixture);
    const minted = ethers.parseUnits("5", 18);
    await token.connect(admin).mint(alice.address, minted);

    const burnTooMuch = ethers.parseUnits("6", 18);
    await expect(token.connect(alice).burn(burnTooMuch))
      .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
      .withArgs(alice.address, minted, burnTooMuch);
  });

  it("decreaseAllowance di bawah 0 harus revert (ERC20InsufficientAllowance)", async function () {
    const { token, admin, alice, bob } = await loadFixture(deployFixture);
    const minted = ethers.parseUnits("100", 18);
    await token.connect(admin).mint(alice.address, minted);

    await token.connect(alice).approve(bob.address, ethers.parseUnits("10", 18));
    await expect(
      token.connect(alice).decreaseAllowance(bob.address, ethers.parseUnits("20", 18))
    )
      .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
      .withArgs(bob.address, ethers.parseUnits("10", 18), ethers.parseUnits("20", 18));
  });

  it("transferFrom: tanpa allowance revert; dengan allowance berkurang sesuai", async function () {
    const { token, admin, alice, bob, carol } = await loadFixture(deployFixture);
    const minted = ethers.parseUnits("50", 18);
    await token.connect(admin).mint(alice.address, minted);

    const amount = ethers.parseUnits("10", 18);
    await expect(
      token.connect(bob).transferFrom(alice.address, carol.address, amount)
    )
      .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
      .withArgs(bob.address, 0n, amount);

    await token.connect(alice).approve(bob.address, amount);
    await expect(
      token.connect(bob).transferFrom(alice.address, carol.address, amount)
    )
      .to.emit(token, "Transfer")
      .withArgs(alice.address, carol.address, amount);

    expect(await token.allowance(alice.address, bob.address)).to.equal(0n);
    expect(await token.balanceOf(alice.address)).to.equal(minted - amount);
    expect(await token.balanceOf(carol.address)).to.equal(amount);
  });

  it("transferFrom: allowance tak berkurang jika allowance = MaxUint256 (infinite allowance pattern)", async function () {
    const { token, admin, alice, bob, carol } = await loadFixture(deployFixture);
    const minted = ethers.parseUnits("100", 18);
    await token.connect(admin).mint(alice.address, minted);

    const INF = ethers.MaxUint256;
    await token.connect(alice).approve(bob.address, INF);

    const amount = ethers.parseUnits("25", 18);
    await token.connect(bob).transferFrom(alice.address, carol.address, amount);

    expect(await token.allowance(alice.address, bob.address)).to.equal(INF);
    expect(await token.balanceOf(alice.address)).to.equal(minted - amount);
    expect(await token.balanceOf(carol.address)).to.equal(amount);
  });

  it("transferFrom: allowance cukup tapi saldo owner kurang -> revert (ERC20InsufficientBalance)", async function () {
    const { token, admin, alice, bob, carol } = await loadFixture(deployFixture);
    const minted = ethers.parseUnits("30", 18);
    await token.connect(admin).mint(alice.address, minted);

    const amount = ethers.parseUnits("40", 18);
    await token.connect(alice).approve(bob.address, amount);

    await expect(
      token.connect(bob).transferFrom(alice.address, carol.address, amount)
    )
      .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
      .withArgs(alice.address, minted, amount);
  });

  it("getRoleAdmin: admin role untuk MINTER_ROLE adalah DEFAULT_ADMIN_ROLE", async function () {
    const { token, DEFAULT_ADMIN_ROLE, MINTER_ROLE } = await loadFixture(deployFixture);
    expect(await token.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
  });

  it("zero-value ops: transfer(0) & approve(0) tidak revert dan tidak mengubah saldo", async function () {
    const { token, admin, alice, bob } = await loadFixture(deployFixture);
    await token.connect(admin).mint(alice.address, ethers.parseUnits("1", 18));

    await expect(token.connect(alice).approve(bob.address, 0n)).to.not.be.reverted;
    const prevBalAlice = await token.balanceOf(alice.address);
    const prevBalBob = await token.balanceOf(bob.address);
    await expect(token.connect(alice).transfer(alice.address, 0n)).to.not.be.reverted;

    expect(await token.balanceOf(alice.address)).to.equal(prevBalAlice);
    expect(await token.balanceOf(bob.address)).to.equal(prevBalBob);
  });

  it("misconfig audit-case: deploy dengan initialAdmin = address(0) mengunci kontrol (terdeteksi di test)", async function () {
    const [anyone] = await ethers.getSigners();
    const LinkaToken = await ethers.getContractFactory("LinkaToken");
    const token = await LinkaToken.deploy(ethers.ZeroAddress);
    await token.waitForDeployment();

    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();

    // Role terset ke address(0) -> tidak usable
    expect(await token.hasRole(DEFAULT_ADMIN_ROLE, ethers.ZeroAddress)).to.equal(true);
    expect(await token.hasRole(MINTER_ROLE, ethers.ZeroAddress)).to.equal(true);

    // Tidak ada yang bisa grant/mint
    await expect(
      token.connect(anyone).grantRole(MINTER_ROLE, anyone.address)
    ).to.be.reverted; // tipe error bisa berbeda antar OZ versi, cukup cek revert

    await expect(
      token.connect(anyone).mint(anyone.address, 1n)
    )
      .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
      .withArgs(anyone.address, MINTER_ROLE);
  });
});