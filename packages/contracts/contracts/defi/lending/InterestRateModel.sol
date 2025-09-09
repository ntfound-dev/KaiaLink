// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Interface minimal agar CToken bisa dikompilasi.
// Implementasi konkret (mis. WhitePaper/JumpRate) harus menyediakan fungsi ini
// mengembalikan borrow rate per block (scaled 1e18).
interface InterestRateModel {
    function getBorrowRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves
    ) external view returns (uint256);
}