// scripts/debugNotify.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const STAKING_ADDR = "0x5864AB44e1aA508CFCEBCc38a3d9A251f3e011a8"; // dari log
  const LINKA_ADDR   = "0x3709DFC40AD77E52a2aA686A834C941Df8bBAEE6"; // dari log

  const linka = await ethers.getContractAt("LinkaTestnet", LINKA_ADDR);
  const staking = await ethers.getContractAt("StakingRewards", STAKING_ADDR);

  console.log("Deployer:", deployer.address);
  console.log("Deployer LINKA balance:", (await linka.balanceOf(deployer.address)).toString());
  console.log("Staking LINKA balance:", (await linka.balanceOf(STAKING_ADDR)).toString());

  // Try to read owner/minter roles on staking (if present)
  try { console.log("Staking.owner():", await (staking as any).owner()); } catch (e) { console.log("owner() not available / or reverted"); }
  try { console.log("Staking.rewardToken():", await (staking as any).rewardsToken()); } catch (e) { console.log("rewardsToken() not available"); }

  // If notifyRewardAmount expects transferFrom, check allowance from deployer -> staking
  try {
    const allowance = await linka.allowance(deployer.address, STAKING_ADDR);
    console.log("Allowance deployer -> staking:", allowance.toString());
  } catch (e) { console.log("allowance() read failed"); }

  // Try a callStatic to get revert reason (estimation as call)
  const amount = ethers.parseEther("10000000"); // same amount used in deploy
  try {
    console.log("Calling callStatic.notifyRewardAmount to catch revert reason...");
    await staking.callStatic.notifyRewardAmount(amount);
    console.log("callStatic succeeded (odd) — suggests txn should succeed");
  } catch (err: any) {
    console.log("callStatic reverted with:", err && err.error && err.error.message ? err.error.message : err.message ? err.message : err);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
