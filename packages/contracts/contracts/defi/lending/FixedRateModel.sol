// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InterestRateModel.sol";

/**
 * @title FixedRateModel
 * @dev Implementasi sederhana dari InterestRateModel yang mengembalikan
 * suku bunga pinjaman per blok yang tetap (konstan).
 */
contract FixedRateModel is InterestRateModel {
    
    // Suku bunga tetap, misal 0.000005% per blok (sekitar 10% APY di Ethereum)
    // Anda bisa mengubah nilai ini sesuai kebutuhan.
    uint256 private constant BORROW_RATE = 5 * 1e12; // 0.000005 * 1e18

    /**
     * @notice Mengembalikan suku bunga pinjaman per blok yang sudah ditetapkan.
     * @dev Parameter cash, borrows, reserves diabaikan karena rate-nya tetap.
     */
    function getBorrowRate(
        uint256 /* cash */,
        uint256 /* borrows */,
        uint256 /* reserves */
    ) external pure override returns (uint256) {
        return BORROW_RATE;
    }
}