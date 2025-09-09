import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function increaseTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("StakingRewards", function () {
  const REWARDS_DURATION = 7 * 24 * 60 * 60; // number
  const REWARDS_DURATION_BI = BigInt(REWARDS_DURATION); // BigInt
  const ONE = 10n ** 18n;

  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const lp = await MockERC20.deploy("LP Token", "LP");
    const reward = await MockERC20.deploy("LINKA", "LINKA");
    await lp.waitForDeployment();
    await reward.waitForDeployment();

    // Mint tokens
    await reward.mint(owner.address, parseUnits("1000000", 18));
    await lp.mint(alice.address, parseUnits("100000", 18));
    await lp.mint(bob.address, parseUnits("100000", 18));

    // Deploy StakingRewards
    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    const staking = await StakingRewards.deploy(await lp.getAddress(), await reward.getAddress());
    await staking.waitForDeployment();

    return { owner, alice, bob, lp, reward, staking };
  }

  it("deploys with correct initial state", async () => {
    const { staking, lp, reward } = await deployFixture();
    expect(await staking.totalSupply()).to.equal(0n);
    expect(await staking.balanceOf(ethers.ZeroAddress)).to.equal(0n);
    expect(await staking.lastTimeRewardApplicable()).to.equal(0n);
    expect(await staking.periodFinish()).to.equal(0n);
    expect(await staking.rewardsDuration()).to.equal(REWARDS_DURATION_BI);
    expect(await staking.rewardRate()).to.equal(0n);
    expect(await staking.lpToken()).to.equal(await lp.getAddress());
    expect(await staking.rewardToken()).to.equal(await reward.getAddress());
  });

  it("stake -> notify -> accrue -> claim -> withdraw works", async () => {
    const { owner, alice, lp, reward, staking } = await deployFixture();

    // Alice stake 100 LP
    const stakeAmt = parseUnits("100", 18);
    await lp.connect(alice).approve(await staking.getAddress(), stakeAmt);
    await staking.connect(alice).stake(stakeAmt);
    expect(await staking.totalSupply()).to.equal(stakeAmt);
    expect(await staking.balanceOf(alice.address)).to.equal(stakeAmt);

    // Owner set reward 7000 LINKA for 7 days
    const rewardAmt = parseUnits("7000", 18);
    await reward.connect(owner).approve(await staking.getAddress(), rewardAmt);
    await expect(staking.connect(owner).notifyRewardAmount(rewardAmt))
      .to.emit(staking, "RewardAdded")
      .withArgs(rewardAmt);

    const rate = await staking.rewardRate();
    expect(rate).to.equal(rewardAmt / REWARDS_DURATION_BI); // integer div

    // Maju waktu setengah periode
    const half = Math.floor(REWARDS_DURATION / 2);
    await increaseTime(half);

    // Ambil state yang relevan sebelum claim (untuk replikasi pembulatan kontrak)
    const lastUpdateBefore = await staking.lastUpdateTime();          // L
    const periodFinish = await staking.periodFinish();                // PF
    const totalSupply = await staking.totalSupply();                 // TS
    const userBalance = await staking.balanceOf(alice.address);      // BAL

    // Claim reward (menambang block baru)
    const aliceRewardBalBefore = await reward.balanceOf(alice.address);
    const tx = await staking.connect(alice).claimReward();
    const receipt = await tx.wait();
    const afterBlock = await ethers.provider.getBlock(receipt!.blockNumber);
    const t2 = BigInt(afterBlock!.timestamp);

    // Replikasi rumus kontrak:
    // rewardPerToken at t2:
    //   rpts2 = floor( (min(t2, PF) - L) * rate * 1e18 / TS )
    // amount paid:
    //   expectedPaid = floor( BAL * rpts2 / 1e18 )
    const timeElapsed = (t2 < periodFinish ? t2 : periodFinish) - lastUpdateBefore;
    const rpts2 = (timeElapsed * rate * ONE) / totalSupply;
    const expectedPaid = (userBalance * rpts2) / ONE;

    await expect(tx)
      .to.emit(staking, "RewardPaid")
      .withArgs(alice.address, expectedPaid);

    const aliceRewardBalAfter = await reward.balanceOf(alice.address);
    expect(aliceRewardBalAfter - aliceRewardBalBefore).to.equal(expectedPaid);

    // Setelah klaim, earned = 0
    expect(await staking.earned(alice.address)).to.equal(0n);

    // Withdraw
    const aliceLpBalBefore = await lp.balanceOf(alice.address);
    await expect(staking.connect(alice).withdraw(stakeAmt))
      .to.emit(staking, "Withdrawn")
      .withArgs(alice.address, stakeAmt);
    const aliceLpBalAfter = await lp.balanceOf(alice.address);
    expect(aliceLpBalAfter - aliceLpBalBefore).to.equal(stakeAmt);
    expect(await staking.balanceOf(alice.address)).to.equal(0n);
  });

  it("multiple stakers share rewards proportionally", async () => {
    const { owner, alice, bob, lp, reward, staking } = await deployFixture();

    const stakeA = parseUnits("100", 18);
    const stakeB = parseUnits("300", 18);

    await lp.connect(alice).approve(await staking.getAddress(), stakeA);
    await lp.connect(bob).approve(await staking.getAddress(), stakeB);
    await staking.connect(alice).stake(stakeA);
    await staking.connect(bob).stake(stakeB);

    const rewardAmt = parseUnits("4000", 18);
    await reward.connect(owner).approve(await staking.getAddress(), rewardAmt);
    await staking.connect(owner).notifyRewardAmount(rewardAmt);

    const rate = await staking.rewardRate();

    // Maju 3 hari
    const forward = 3 * 24 * 60 * 60;
    await increaseTime(forward);

    // Total minted so far = rate * forward (aproksimasi)
    const minted = rate * BigInt(forward);
    const totalStake = stakeA + stakeB;

    const earnedA = await staking.earned(alice.address);
    const earnedB = await staking.earned(bob.address);

    const expectedA = (minted * stakeA) / totalStake;
    const expectedB = (minted * stakeB) / totalStake;

    // Sedikit toleransi karena pembulatan internal
    expect(earnedA).to.be.closeTo(expectedA, 1n);
    expect(earnedB).to.be.closeTo(expectedB, 1n);
    expect(earnedA + earnedB).to.be.closeTo(minted, 2n);
  });

  it("notifyRewardAmount before periodFinish rolls leftover correctly", async () => {
    const { owner, alice, lp, reward, staking } = await deployFixture();

    // Alice stake
    const stakeAmt = parseUnits("1000", 18);
    await lp.connect(alice).approve(await staking.getAddress(), stakeAmt);
    await staking.connect(alice).stake(stakeAmt);

    // First reward
    const r1 = parseUnits("7000", 18);
    await reward.connect(owner).approve(await staking.getAddress(), r1);
    await staking.connect(owner).notifyRewardAmount(r1);
    const rate1 = await staking.rewardRate();

    // Timestamp saat notify pertama
    const block1 = await ethers.provider.getBlock("latest");
    const t1 = BigInt(block1!.timestamp);

    // Travel 1 day, then notify again
    const oneDay = 24 * 60 * 60;
    await increaseTime(oneDay);

    // Second reward (overlap)
    const r2 = parseUnits("21000", 18);
    await reward.connect(owner).approve(await staking.getAddress(), r2);
    await staking.connect(owner).notifyRewardAmount(r2);

    const block2 = await ethers.provider.getBlock("latest");
    const now = BigInt(block2!.timestamp);
    const remainingOld = (t1 + REWARDS_DURATION_BI > now) ? (t1 + REWARDS_DURATION_BI - now) : 0n;
    const leftover = remainingOld * rate1;
    const expectedRate2 = (r2 + leftover) / REWARDS_DURATION_BI;

    const rate2 = await staking.rewardRate();
    expect(rate2).to.equal(expectedRate2);
  });

  it("setRewardsDuration only after period finished", async () => {
    const { owner, alice, lp, reward, staking } = await deployFixture();

    await lp.connect(alice).approve(await staking.getAddress(), parseUnits("10", 18));
    await staking.connect(alice).stake(parseUnits("10", 18));
    await reward.connect(owner).approve(await staking.getAddress(), parseUnits("700", 18));
    await staking.connect(owner).notifyRewardAmount(parseUnits("700", 18));

    await expect(
      staking.connect(owner).setRewardsDuration(5 * 24 * 60 * 60)
    ).to.be.revertedWith("Previous period not finished");

    await increaseTime(REWARDS_DURATION + 1);

    await expect(
      staking.connect(owner).setRewardsDuration(5 * 24 * 60 * 60)
    ).to.emit(staking, "RewardsDurationUpdated")
     .withArgs(BigInt(5 * 24 * 60 * 60));

    expect(await staking.rewardsDuration()).to.equal(BigInt(5 * 24 * 60 * 60));
  });

  it("rescueERC20 blocks lpToken and rewardToken, allows other tokens", async () => {
    const { owner, lp, reward, staking } = await deployFixture();

    // Deploy token lain
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const other = await MockERC20.deploy("OTHER", "OTHR");
    await other.waitForDeployment();
    await other.mint(await staking.getAddress(), parseUnits("100", 18));

    await expect(
      staking.connect(owner).rescueERC20(await lp.getAddress(), 1, owner.address)
    ).to.be.revertedWith("Cannot rescue lpToken");

    await expect(
      staking.connect(owner).rescueERC20(await reward.getAddress(), 1, owner.address)
    ).to.be.revertedWith("Cannot rescue rewardToken");

    const ownerBalBefore = await other.balanceOf(owner.address);
    await staking.connect(owner).rescueERC20(await other.getAddress(), parseUnits("100", 18), owner.address);
    const ownerBalAfter = await other.balanceOf(owner.address);
    expect(ownerBalAfter - ownerBalBefore).to.equal(parseUnits("100", 18));
  });

  it("validates inputs and balances", async () => {
    const { alice, staking } = await deployFixture();
    await expect(staking.connect(alice).stake(0)).to.be.revertedWith("Cannot stake 0");
    await expect(staking.connect(alice).withdraw(0)).to.be.revertedWith("Cannot withdraw 0");
    await expect(staking.connect(alice).withdraw(1)).to.be.revertedWith("Insufficient balance");
    // claim tanpa reward tidak revert
    await expect(staking.connect(alice).claimReward()).to.not.be.reverted;
  });
});