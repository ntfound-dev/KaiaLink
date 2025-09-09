// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title LinkaToken
 * @dev Token ERC20 utama untuk ekosistem KaiaLink.
 * Menggunakan AccessControl untuk mengelola siapa yang bisa mencetak token baru.
 * Menggunakan ERC20Burnable untuk memungkinkan pengguna membakar token mereka sendiri.
 */
contract LinkaToken is ERC20, AccessControl, ERC20Burnable {
    /**
     * @dev Role untuk akun yang diizinkan untuk mencetak token baru.
     */
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @dev Constructor untuk menginisialisasi token.
     * @param initialAdmin Alamat yang akan menjadi admin default dan minter pertama.
     */
    constructor(address initialAdmin) ERC20("KaiaLink Token", "LINKA") {
        // Memberikan peran admin default kepada deployer (atau alamat yang ditentukan)
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        
        // Memberikan peran minter kepada deployer (atau alamat yang ditentukan)
        _grantRole(MINTER_ROLE, initialAdmin);
    }

    /**
     * @dev Mencetak token baru dan memberikannya ke alamat `to`.
     * Hanya bisa dipanggil oleh akun dengan MINTER_ROLE.
     * @param to Alamat penerima token baru.
     * @param amount Jumlah token yang akan dicetak.
     */
    function mint(address to, uint256 amount) public virtual onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // Tambahkan di kontrak LinkaToken (opsional)
function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
    address owner = _msgSender();
    uint256 newAllowance = allowance(owner, spender) + addedValue;
    _approve(owner, spender, newAllowance);
    return true;
}

function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
    address owner = _msgSender();
    uint256 current = allowance(owner, spender);
    if (current < subtractedValue) {
        revert ERC20InsufficientAllowance(spender, current, subtractedValue);
    }
    unchecked {
        _approve(owner, spender, current - subtractedValue);
    }
    return true;
}

}