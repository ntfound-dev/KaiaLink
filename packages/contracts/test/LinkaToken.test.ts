import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("LinkaToken", function () {
  async function deployLinkaTokenFixture() {
    const [deployer, admin, alice, bob] = await ethers.getSigners();

    const LinkaToken = await ethers.getContractFactory("LinkaToken");
    const token = await LinkaToken.deploy(admin.address);
    await token.waitForDeployment();

    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();

    return {
      token,
      deployer,
      admin,
      alice,
      bob,
      DEFAULT_ADMIN_ROLE,
      MINTER_ROLE,
    };
  }

  describe("Deployment", function () {
    it("nama, simbol, decimals, dan initial supply sesuai", async function () {
      const { token } = await loadFixture(deployLinkaTokenFixture);

      expect(await token.name()).to.equal("KaiaLink Token");
      expect(await token.symbol()).to.equal("LINKA");
      expect(await token.decimals()).to.equal(18);
      expect(await token.totalSupply()).to.equal(0n);
    });

    it("grant DEFAULT_ADMIN_ROLE dan MINTER_ROLE ke initialAdmin saja", async function () {
      const { token, deployer, admin, DEFAULT_ADMIN_ROLE, MINTER_ROLE } =
        await loadFixture(deployLinkaTokenFixture);

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(
        true
      );
      expect(await token.hasRole(MINTER_ROLE, admin.address)).to.equal(true);

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.equal(
        false
      );
      expect(await token.hasRole(MINTER_ROLE, deployer.address)).to.equal(false);
    });
  });

  describe("Mint", function () {
    it("hanya MINTER_ROLE yang bisa mint", async function () {
      const { token, admin, alice, MINTER_ROLE } = await loadFixture(
        deployLinkaTokenFixture
      );

      const amount = ethers.parseUnits("1000", 18);

      await expect(
        token.connect(alice).mint(alice.address, amount)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, MINTER_ROLE);

      await expect(token.connect(admin).mint(alice.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, amount);

      expect(await token.totalSupply()).to.equal(amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
    });

    it("admin dapat grant dan revoke MINTER_ROLE", async function () {
      const {
        token,
        admin,
        alice,
        bob,
        DEFAULT_ADMIN_ROLE,
        MINTER_ROLE,
      } = await loadFixture(deployLinkaTokenFixture);

      await expect(
        token.connect(bob).grantRole(MINTER_ROLE, bob.address)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(bob.address, DEFAULT_ADMIN_ROLE);

      await expect(token.connect(admin).grantRole(MINTER_ROLE, alice.address))
        .to.emit(token, "RoleGranted")
        .withArgs(MINTER_ROLE, alice.address, admin.address);

      expect(await token.hasRole(MINTER_ROLE, alice.address)).to.equal(true);

      const amount = ethers.parseUnits("1", 18);
      await token.connect(alice).mint(bob.address, amount);
      expect(await token.balanceOf(bob.address)).to.equal(amount);

      await expect(token.connect(admin).revokeRole(MINTER_ROLE, alice.address))
        .to.emit(token, "RoleRevoked")
        .withArgs(MINTER_ROLE, alice.address, admin.address);

      expect(await token.hasRole(MINTER_ROLE, alice.address)).to.equal(false);

      await expect(
        token.connect(alice).mint(bob.address, amount)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, MINTER_ROLE);
    });
  });

  describe("Transfer", function () {
    it("holder bisa transfer token normal", async function () {
      const { token, admin, alice, bob } = await loadFixture(
        deployLinkaTokenFixture
      );

      const amount = ethers.parseUnits("100", 18);
      await token.connect(admin).mint(alice.address, amount);

      await expect(token.connect(alice).transfer(bob.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(alice.address, bob.address, amount);

      expect(await token.balanceOf(alice.address)).to.equal(0n);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
    });
  });

  describe("Burn", function () {
    it("user dapat burn token miliknya sendiri", async function () {
      const { token, admin, alice } = await loadFixture(
        deployLinkaTokenFixture
      );

      const mintAmount = ethers.parseUnits("500", 18);
      await token.connect(admin).mint(alice.address, mintAmount);

      const burnAmount = ethers.parseUnits("200", 18);

      await expect(token.connect(alice).burn(burnAmount))
        .to.emit(token, "Transfer")
        .withArgs(alice.address, ethers.ZeroAddress, burnAmount);

      expect(await token.balanceOf(alice.address)).to.equal(
        mintAmount - burnAmount
      );
      expect(await token.totalSupply()).to.equal(mintAmount - burnAmount);
    });

    it("burnFrom butuh allowance dan mengurangi allowance", async function () {
      const { token, admin, alice, bob } = await loadFixture(
        deployLinkaTokenFixture
      );

      const mintAmount = ethers.parseUnits("1000", 18);
      await token.connect(admin).mint(alice.address, mintAmount);

      const burnAmount = ethers.parseUnits("300", 18);

      await expect(token.connect(bob).burnFrom(alice.address, burnAmount))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
        .withArgs(bob.address, 0n, burnAmount);

      await token.connect(alice).approve(bob.address, burnAmount);

      await expect(token.connect(bob).burnFrom(alice.address, burnAmount))
        .to.emit(token, "Transfer")
        .withArgs(alice.address, ethers.ZeroAddress, burnAmount);

      expect(await token.allowance(alice.address, bob.address)).to.equal(0n);
      expect(await token.balanceOf(alice.address)).to.equal(
        mintAmount - burnAmount
      );
      expect(await token.totalSupply()).to.equal(mintAmount - burnAmount);
    });
  });
});