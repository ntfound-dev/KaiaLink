// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MerkleDistributor
 * @dev Kontrak ini mendistribusikan sejumlah token ERC20 kepada sekumpulan alamat
 * yang ditentukan dalam sebuah Merkle tree.
 * Hal ini memungkinkan distribusi massal yang efisien gas, di mana setiap penerima
 * menarik (pull) dana mereka sendiri daripada pengirim mendorong (push) ke semua.
 */
contract MerkleDistributor is Ownable {
    // Alamat token yang akan didistribusikan
    address public immutable token;
    // Merkle Root yang merepresentasikan seluruh daftar distribusi
    bytes32 public immutable merkleRoot;

    // Mapping untuk melacak indeks mana yang sudah diklaim untuk mencegah klaim ganda.
    // Key adalah indeks pengguna dalam daftar distribusi off-chain.
    mapping(uint256 => bool) public isClaimed;

    // Event yang dipancarkan saat seorang pengguna berhasil melakukan klaim
    event Claimed(uint256 index, address account, uint256 amount);

    /**
     * @dev Constructor untuk men-setup kontrak.
     * @param _token Alamat token ERC20 yang akan didistribusikan.
     * @param _merkleRoot Root dari Merkle tree yang berisi data distribusi.
     */
    constructor(address _token, bytes32 _merkleRoot) Ownable(msg.sender) {
        token = _token;
        merkleRoot = _merkleRoot;
    }

    /**
     * @dev Fungsi utama yang dipanggil oleh pengguna untuk mengklaim token mereka.
     * @param index Indeks pengguna dalam daftar asli (digunakan untuk mencegah klaim ganda).
     * @param account Alamat penerima token.
     * @param amount Jumlah token yang akan diklaim.
     * @param merkleProof Bukti Merkle yang membuktikan bahwa data ini valid.
     */
    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external {
        require(!isClaimed[index], "MerkleDistributor: Drop already claimed.");

        // Membuat "leaf" dari data yang diberikan. Leaf ini adalah hash dari
        // data pengguna, yang harus cocok dengan salah satu leaf di Merkle Tree.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));

        // Verifikasi bahwa leaf yang dibuat ada di dalam tree menggunakan proof yang diberikan.
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "MerkleDistributor: Invalid proof.");

        // Tandai indeks ini sebagai sudah diklaim untuk mencegah klaim ulang.
        isClaimed[index] = true;

        // Transfer token ke penerima.
        require(IERC20(token).transfer(account, amount), "MerkleDistributor: Transfer failed.");

        emit Claimed(index, account, amount);
    }
    
    /**
     * @dev Fungsi untuk pemilik kontrak menarik sisa token yang tidak diklaim
     * setelah periode airdrop berakhir. Ini penting agar dana tidak terkunci selamanya.
     * Sebaiknya ditambahkan logika waktu (misalnya, hanya bisa ditarik setelah 1 tahun).
     * @param to Alamat untuk mengirim sisa token.
     */
    function withdrawUnclaimed(address to) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "MerkleDistributor: No tokens to withdraw.");
        require(IERC20(token).transfer(to, balance), "MerkleDistributor: Withdraw failed.");
    }
}