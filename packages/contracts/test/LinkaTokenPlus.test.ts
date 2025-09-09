import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("LinkaTokenPlus", function () {
async function deployFixture() {
const [deployer, admin, alice, bob, carol, newAdmin] = await ethers.getSigners();
const capTokens = "1000000"; // 1,000,000 LINKA
const capWei = ethers.parseUnits(capTokens, 18);

const LinkaTokenPlus = await ethers.getContractFactory("LinkaTokenPlus");
const token = await LinkaTokenPlus.deploy(admin.address, capWei);
await token.waitForDeployment();

const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
const MINTER_ROLE = await token.MINTER_ROLE();
const PAUSER_ROLE = await token.PAUSER_ROLE();

return {
  token,
  deployer,
  admin,
  alice,
  bob,
  carol,
  newAdmin,
  DEFAULT_ADMIN_ROLE,
  MINTER_ROLE,
  PAUSER_ROLE,
  capWei,
};
}

describe("Deployment & Roles", function () {
it("nama, simbol, decimals, totalSupply awal = 0, cap ter-set", async function () {
const { token, capWei } = await loadFixture(deployFixture);
expect(await token.name()).to.equal("KaiaLink Token");
expect(await token.symbol()).to.equal("LINKA");
expect(await token.decimals()).to.equal(18);
expect(await token.totalSupply()).to.equal(0n);
expect(await token.cap()).to.equal(capWei);
});

it("default admin adalah initialAdmin (bisa grant/revoke role)", async function () {
  const { token, admin, alice, MINTER_ROLE } = await loadFixture(deployFixture);

  expect(await token.defaultAdmin()).to.equal(admin.address);

  await expect(token.connect(admin).grantRole(MINTER_ROLE, alice.address))
    .to.emit(token, "RoleGranted")
    .withArgs(MINTER_ROLE, alice.address, admin.address);

  expect(await token.hasRole(MINTER_ROLE, alice.address)).to.equal(true);

  await expect(token.connect(admin).revokeRole(MINTER_ROLE, alice.address))
    .to.emit(token, "RoleRevoked")
    .withArgs(MINTER_ROLE, alice.address, admin.address);
});

it("constructor guard: initialAdmin != 0x0 dan cap > 0", async function () {
  const LinkaTokenPlus = await ethers.getContractFactory("LinkaTokenPlus");

  // AccessControlDefaultAdminRules akan revert dengan error custom-nya sendiri
  await expect(LinkaTokenPlus.deploy(ethers.ZeroAddress, 1n))
    .to.be.revertedWithCustomError(LinkaTokenPlus, "AccessControlInvalidDefaultAdmin");

  // ERC20Capped v5 akan revert jika cap = 0 (custom error-nya dari OZ)
  await expect(LinkaTokenPlus.deploy((await ethers.getSigners())[0].address, 0n))
    .to.be.reverted; // jika mau spesifik, bisa coba "ERC20InvalidCap" sesuai versi OZ
});
});

describe("Mint/Transfer/Burn", function () {
it("only MINTER_ROLE yang bisa mint; normal transfer/burn berfungsi", async function () {
const { token, admin, alice, bob, MINTER_ROLE } = await loadFixture(deployFixture);

  const amount = ethers.parseUnits("1000", 18);
  await token.connect(admin).mint(alice.address, amount);

  await expect(token.connect(bob).mint(bob.address, 1n))
    .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
    .withArgs(bob.address, MINTER_ROLE);

  await expect(token.connect(alice).transfer(bob.address, amount / 2n))
    .to.emit(token, "Transfer");

  await expect(token.connect(bob).burn(amount / 4n))
    .to.emit(token, "Transfer")
    .withArgs(bob.address, ethers.ZeroAddress, amount / 4n);
});

it("cap: mint melebihi cap harus revert", async function () {
  const { token, admin, alice, capWei } = await loadFixture(deployFixture);
  await token.connect(admin).mint(alice.address, capWei);
  await expect(token.connect(admin).mint(alice.address, 1n)).to.be.reverted;
});
});

describe("Pausable (emergency)", function () {
it("pause menahan transfer/mint/burn; unpause mengembalikan normal", async function () {
const { token, admin, alice, bob } = await loadFixture(deployFixture);
const amount = ethers.parseUnits("100", 18);
await token.connect(admin).mint(alice.address, amount);

  await token.connect(admin).pause();

  await expect(token.connect(alice).transfer(bob.address, 1n))
    .to.be.revertedWithCustomError(token, "EnforcedPause");
  await expect(token.connect(admin).mint(bob.address, 1n))
    .to.be.revertedWithCustomError(token, "EnforcedPause");
  await expect(token.connect(alice).burn(1n))
    .to.be.revertedWithCustomError(token, "EnforcedPause");

  await token.connect(admin).unpause();
  await expect(token.connect(alice).transfer(bob.address, 1n)).to.emit(token, "Transfer");
});
});

describe("Permit (EIP-2612)", function () {
it("permit: atur allowance via signature, nonce bertambah", async function () {
const { token, alice, bob } = await loadFixture(deployFixture);
const value = ethers.parseUnits("123", 18);
const deadline = BigInt(Math.floor(Date.now() / 1000)) + 3600n;

  const nonce = await token.nonces(alice.address);
  const chainId = (await ethers.provider.getNetwork()).chainId;

  const domain = {
    name: "KaiaLink Token",
    version: "1",
    chainId, // bigint oke untuk ethers v6
    verifyingContract: await token.getAddress(),
  };
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };
  const message = {
    owner: alice.address,
    spender: bob.address,
    value,
    nonce,
    deadline,
  };

  const sig = await alice.signTypedData(domain, types, message);
  const { v, r, s } = ethers.Signature.from(sig);

  await expect(token.permit(alice.address, bob.address, value, deadline, v, r, s))
    .to.emit(token, "Approval")
    .withArgs(alice.address, bob.address, value);

  expect(await token.nonces(alice.address)).to.equal(nonce + 1n);
  expect(await token.allowance(alice.address, bob.address)).to.equal(value);
});

it("permit: expired deadline harus revert", async function () {
  const { token, alice, bob } = await loadFixture(deployFixture);
  const value = ethers.parseUnits("1", 18);
  const deadline = BigInt(Math.floor(Date.now() / 1000) - 1);

  const nonce = await token.nonces(alice.address);
  const chainId = (await ethers.provider.getNetwork()).chainId;

  const domain = {
    name: "KaiaLink Token",
    version: "1",
    chainId,
    verifyingContract: await token.getAddress(),
  };
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };
  const message = {
    owner: alice.address,
    spender: bob.address,
    value,
    nonce,
    deadline,
  };

  const sig = await alice.signTypedData(domain, types, message);
  const { v, r, s } = ethers.Signature.from(sig);

  await expect(
    token.permit(alice.address, bob.address, value, deadline, v, r, s)
  ).to.be.revertedWithCustomError(token, "ERC2612ExpiredSignature");
});

it("permit: signer salah harus revert", async function () {
  const { token, alice, bob, carol } = await loadFixture(deployFixture);
  const value = ethers.parseUnits("1", 18);
  const deadline = BigInt(Math.floor(Date.now() / 1000)) + 3600n;

  const nonce = await token.nonces(alice.address);
  const chainId = (await ethers.provider.getNetwork()).chainId;

  const domain = {
    name: "KaiaLink Token",
    version: "1",
    chainId,
    verifyingContract: await token.getAddress(),
  };
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };
  const message = {
    owner: alice.address,
    spender: bob.address,
    value,
    nonce,
    deadline,
  };

  // Ditandatangani carol (bukan owner)
  const sig = await carol.signTypedData(domain, types, message);
  const { v, r, s } = ethers.Signature.from(sig);

  await expect(
    token.permit(alice.address, bob.address, value, deadline, v, r, s)
  ).to.be.revertedWithCustomError(token, "ERC2612InvalidSigner");
});
});

describe("Allowance behaviors", function () {
it("transferFrom: tanpa allowance revert, dengan allowance berhasil dan allowance berkurang", async function () {
const { token, admin, alice, bob, carol } = await loadFixture(deployFixture);
const minted = ethers.parseUnits("50", 18);
await token.connect(admin).mint(alice.address, minted);

  const amount = ethers.parseUnits("10", 18);
  await expect(token.connect(bob).transferFrom(alice.address, carol.address, amount))
    .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
    .withArgs(bob.address, 0n, amount);

  await token.connect(alice).approve(bob.address, amount);
  await token.connect(bob).transferFrom(alice.address, carol.address, amount);

  expect(await token.allowance(alice.address, bob.address)).to.equal(0n);
  expect(await token.balanceOf(alice.address)).to.equal(minted - amount);
  expect(await token.balanceOf(carol.address)).to.equal(amount);
});

it("infinite allowance (MaxUint256) tidak berkurang untuk transferFrom dan burnFrom", async function () {
  const { token, admin, alice, bob } = await loadFixture(deployFixture);
  const minted = ethers.parseUnits("100", 18);
  await token.connect(admin).mint(alice.address, minted);

  const INF = ethers.MaxUint256;
  await token.connect(alice).approve(bob.address, INF);

  const xfer = ethers.parseUnits("25", 18);
  await token.connect(bob).transferFrom(alice.address, bob.address, xfer);
  expect(await token.allowance(alice.address, bob.address)).to.equal(INF);

  const burnAmt = ethers.parseUnits("20", 18);
  await token.connect(bob).burnFrom(alice.address, burnAmt);
  expect(await token.allowance(alice.address, bob.address)).to.equal(INF);

  expect(await token.balanceOf(alice.address)).to.equal(minted - xfer - burnAmt);
});
});

describe("DefaultAdmin transfer (2-step + delay)", function () {
it("begin -> accept setelah delay; cancel sebelum accept", async function () {
const { token, admin, newAdmin, alice, MINTER_ROLE } = await loadFixture(deployFixture);

  const delay = await token.defaultAdminDelay();

  // Begin transfer
  await token.connect(admin).beginDefaultAdminTransfer(newAdmin.address);

  // Terlalu cepat accept -> revert (cukup cek revert)
  await expect(token.connect(newAdmin).acceptDefaultAdminTransfer()).to.be.reverted;

  // Cancel oleh admin lama
  await token.connect(admin).cancelDefaultAdminTransfer();

  // Pastikan tidak bisa accept setelah cancel
  await expect(token.connect(newAdmin).acceptDefaultAdminTransfer()).to.be.reverted;

  // Mulai lagi lalu tunggu delay
  await token.connect(admin).beginDefaultAdminTransfer(newAdmin.address);
  await time.increase(Number(delay) + 1);

  // Terima oleh newAdmin
  await token.connect(newAdmin).acceptDefaultAdminTransfer();

  expect(await token.defaultAdmin()).to.equal(newAdmin.address);

  // Verifikasi newAdmin bisa mengelola role
  await expect(token.connect(newAdmin).grantRole(MINTER_ROLE, alice.address))
    .to.emit(token, "RoleGranted");
});
});

describe("Misc edge cases", function () {
it("transfer ke zero address & mint ke zero address revert", async function () {
const { token, admin, alice } = await loadFixture(deployFixture);
const amount = ethers.parseUnits("10", 18);
await token.connect(admin).mint(alice.address, amount);

  await expect(token.connect(admin).mint(ethers.ZeroAddress, 1n))
    .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver")
    .withArgs(ethers.ZeroAddress);

  await expect(token.connect(alice).transfer(ethers.ZeroAddress, 1n))
    .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver")
    .withArgs(ethers.ZeroAddress);
});

it("self-transfer non-zero tidak mengubah saldo bersih", async function () {
  const { token, admin, alice } = await loadFixture(deployFixture);
  const amount = ethers.parseUnits("10", 18);
  await token.connect(admin).mint(alice.address, amount);
  await expect(token.connect(alice).transfer(alice.address, amount)).to.not.be.reverted;
  expect(await token.balanceOf(alice.address)).to.equal(amount);
});
});
});