// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../defi/lending/InterestRateModel.sol";

// KONTRAK INI HANYA UNTUK KEPERLUAN TES
contract MockInterestRateModel is InterestRateModel {
    uint256 private immutable rate;

    // Set suku bunga tetap saat deploy (misal: 0.05% per blok)
    constructor(uint256 fixedRateMantissa) {
        rate = fixedRateMantissa;
    }

    /**
     * @dev Nama parameter (cash, borrows, reserves) dihapus untuk menghilangkan warning
     * karena memang sengaja tidak digunakan dalam mock ini.
     */
    function getBorrowRate(
        uint256, // cash
        uint256, // borrows
        uint256  // reserves
    ) external view override returns (uint256) {
        // Abaikan parameter, kembalikan rate tetap untuk tes yang bisa diprediksi
        return rate;
    }
}