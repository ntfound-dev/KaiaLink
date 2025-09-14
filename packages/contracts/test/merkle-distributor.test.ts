// packages/contracts/test/merkle-distributor.test.ts
// Disesuaikan untuk MerkleDistributor.sol versi LAMA

import { ethers } from "hardhat";
import { expect } from "chai";
import { MerkleTree } from "merkletreejs";

describe("MerkleDistributor Test (Versi Lama)", function () {
  let merkleDistributor: any, mockToken: any;
  let deployer: any, user1: any, user2: any, nonAirdropUser: any;
  let merkleTree: MerkleTree;
  let airdropLeaves: { index: number; address: string; amount: bigint }[];

  beforeEach(async function () {
    [deployer, user1, user2, nonAirdropUser] = await ethers.getSigners();

    const MockTokenFactory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockTokenFactory.deploy("Mock Token", "MTK");
    if (mockToken.waitForDeployment) await mockToken.waitForDeployment();
    await mockToken.mint(deployer.address, ethers.parseEther("1000000"));

    airdropLeaves = [
      { index: 0, address: user1.address, amount: ethers.parseEther("100") },
      { index: 1, address: user2.address, amount: ethers.parseEther("250") },
    ];

    // --- Opsi A: langsung pakai hex (lebih ringkas) ---
    const leafNodesHex = airdropLeaves.map(leaf =>
      // solidityPackedKeccak256 menghasilkan keccak256(abi.encodePacked(...)) sebagai hex string
      ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256"],
        [leaf.index, leaf.address, leaf.amount]
      )
    );

    // Buat Merkle tree — merkletreejs menerima hex-string leaves dan hashFn yang juga bisa mengembalikan hex.
    // Kita gunakan ethers.keccak256 sebagai hash function.
    merkleTree = new MerkleTree(leafNodesHex, (v: any) => ethers.keccak256(v), { sortPairs: true });

    // --- Opsi B (lebih robust): konversi ke Buffer dan pakai hashFn yang mengembalikan Buffer ---
    // Uncomment kalau merkletreejs di environmentmu butuh Buffer
    /*
    const leafNodesBuffer = leafNodesHex.map(h => Buffer.from(h.slice(2), "hex"));
    const hashFn = (data: Buffer | string) => {
      // ethers.keccak256 menerima BytesLike (Buffer ok), hasilnya hex string -> kita konversi ke Buffer
      const hashedHex = ethers.keccak256(data as any);
      return Buffer.from((hashedHex as string).slice(2), "hex");
    };
    merkleTree = new MerkleTree(leafNodesBuffer, hashFn, { sortPairs: true });
    */

    const merkleRoot = merkleTree.getHexRoot();

    const MerkleDistributorFactory = await ethers.getContractFactory("MerkleDistributor");

    // =====================================================================
    // PERUBAHAN DI SINI: Hapus argumen ke-3 (claimDuration) jika kontrak lamamu tidak butuhnya
    // =====================================================================
    merkleDistributor = await MerkleDistributorFactory.deploy(
      await mockToken.getAddress(),
      merkleRoot
      // Argumen claimDuration dihapus
    );
    if (merkleDistributor.waitForDeployment) await merkleDistributor.waitForDeployment();

    // total airdrop amount (jumlahkan bigint)
    const totalAirdropAmount = airdropLeaves.reduce((sum, leaf) => sum + leaf.amount, 0n);
    await mockToken.transfer(await merkleDistributor.getAddress(), totalAirdropAmount);
  });

  it("Should allow a valid user to claim their tokens", async function () {
    const leafData = airdropLeaves[0];
    const leafNode = ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"],
      [leafData.index, leafData.address, leafData.amount]
    );
    const proof = merkleTree.getHexProof(leafNode);
    const balanceBefore = await mockToken.balanceOf(user1.address);

    await expect(
      merkleDistributor.connect(user1).claim(leafData.index, leafData.address, leafData.amount, proof)
    ).to.emit(merkleDistributor, "Claimed").withArgs(leafData.index, leafData.address, leafData.amount);

    const balanceAfter = await mockToken.balanceOf(user1.address);
    expect(balanceAfter).to.equal(balanceBefore + leafData.amount);
    expect(await merkleDistributor.isClaimed(leafData.index)).to.be.true;
  });

  it("Should prevent a user from claiming twice", async function () {
    const leafData = airdropLeaves[0];
    const leafNode = ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"],
      [leafData.index, leafData.address, leafData.amount]
    );
    const proof = merkleTree.getHexProof(leafNode);
    await merkleDistributor.connect(user1).claim(leafData.index, leafData.address, leafData.amount, proof);

    await expect(
      merkleDistributor.connect(user1).claim(leafData.index, leafData.address, leafData.amount, proof)
    ).to.be.revertedWith("MerkleDistributor: Drop already claimed.");
  });

  it("Should reject a claim with an invalid proof", async function () {
    const leafData = airdropLeaves[0];
    const wrongLeafData = airdropLeaves[1];
    const wrongLeafNode = ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"],
      [wrongLeafData.index, wrongLeafData.address, wrongLeafData.amount]
    );
    const wrongProof = merkleTree.getHexProof(wrongLeafNode);

    await expect(
      merkleDistributor.connect(user1).claim(leafData.index, leafData.address, leafData.amount, wrongProof)
    ).to.be.revertedWith("MerkleDistributor: Invalid proof.");
  });

  it("Should prevent a non-airdrop user from claiming", async function () {
    const leafData = airdropLeaves[0];
    const leafNode = ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"],
      [leafData.index, leafData.address, leafData.amount]
    );
    const proof = merkleTree.getHexProof(leafNode);

    await expect(
      merkleDistributor.connect(nonAirdropUser).claim(leafData.index, nonAirdropUser.address, leafData.amount, proof)
    ).to.be.revertedWith("MerkleDistributor: Invalid proof.");
  });
});
