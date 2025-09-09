const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const admin = process.env.ADMIN || deployer.address;

  console.log("Deployer:", deployer.address);
  console.log("Admin:", admin);

  // Deploy SBT
  const SBT = await ethers.getContractFactory("SBT");
  const sbt = await SBT.deploy(admin);
  await sbt.waitForDeployment();
  console.log("SBT deployed at:", await sbt.getAddress());

  // Deploy PointsMinter
  const PointsMinter = await ethers.getContractFactory("PointsMinter");
  const pm = await PointsMinter.deploy(await sbt.getAddress(), admin);
  await pm.waitForDeployment();
  console.log("PointsMinter deployed at:", await pm.getAddress());

  // Grant MINTER_ROLE to PointsMinter
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const txGrant = await sbt.grantRole(MINTER_ROLE, await pm.getAddress());
  await txGrant.wait();
  console.log("Granted MINTER_ROLE to PointsMinter");

  // Set sample levels: Bronze, Silver, Gold
  const levels = [
    { minPoints: 1_000_000n, uri: "ipfs://bronze" },
    { minPoints: 2_000_000n, uri: "ipfs://silver" },
    { minPoints: 5_000_000n, uri: "ipfs://gold" }
  ];
  const txLevels = await pm.setLevels(levels);
  await txLevels.wait();
  console.log("Levels set:", levels);

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});