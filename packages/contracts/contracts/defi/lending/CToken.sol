// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./InterestRateModel.sol";
import "./Comptroller.sol";

contract CToken is ERC20 {
    using SafeERC20 for IERC20;

    // Konstanta mantissa 1e18
    uint256 private constant MANTISSA = 1e18;

    // Token underlying yang disupply/dipinjam
    IERC20 public immutable underlying;

    // Komponen eksternal
    Comptroller public immutable comptroller;
    InterestRateModel public immutable interestRateModel;

    // Parameter ekonomi
    uint256 public immutable initialExchangeRateMantissa; // exchange rate awal (mis. 1e18 = 1:1)
    uint256 public reserveFactorMantissa;                 // porsi bunga yang masuk reserve (0..1e18)

    // Akuntansi bunga (Compound-style)
    uint256 public accrualBlockNumber; // blok terakhir akrual
    uint256 public borrowIndex;        // indeks bunga borrow (scaled 1e18)
    uint256 public totalBorrows;       // total pokok pinjaman
    uint256 public totalReserves;      // total reserve yang terakumulasi

    // Snapshot pinjaman per akun
    struct BorrowSnapshot {
        uint256 principal;     // pokok pada saat terakhir update
        uint256 interestIndex; // borrowIndex pada saat terakhir update
    }
    mapping(address => BorrowSnapshot) public accountBorrows;

    // Events
    event AccrueInterest(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 borrowIndex,
        uint256 blockNumber,
        uint256 borrowRatePerBlock,
        uint256 interestAccumulated
    );
    event Mint(address indexed minter, uint256 mintAmount, uint256 mintTokens);
    event Redeem(address indexed redeemer, uint256 redeemTokens, uint256 redeemAmount);
    event Borrow(address indexed borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows);
    event RepayBorrow(address indexed payer, address indexed borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows);
    event NewReserveFactor(uint256 oldReserveFactor, uint256 newReserveFactor);

    constructor(
        address underlying_,
        address comptroller_,
        address interestRateModel_,
        uint256 initialExchangeRateMantissa_, // contoh: 1e18 untuk 1:1
        uint256 reserveFactorMantissa_,       // contoh: 0 untuk awal
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        require(underlying_ != address(0) && comptroller_ != address(0) && interestRateModel_ != address(0), "CToken: zero addr");
        require(initialExchangeRateMantissa_ > 0, "CToken: bad init exRate");
        require(reserveFactorMantissa_ <= MANTISSA, "CToken: bad reserve factor");

        underlying = IERC20(underlying_);
        comptroller = Comptroller(comptroller_);
        interestRateModel = InterestRateModel(interestRateModel_);
        initialExchangeRateMantissa = initialExchangeRateMantissa_;
        reserveFactorMantissa = reserveFactorMantissa_;

        accrualBlockNumber = block.number;
        borrowIndex = MANTISSA; // mulai dari 1e18
    }

    // =========================
    // Views utilitas
    // =========================

    function getCash() public view returns (uint256) {
        return underlying.balanceOf(address(this));
    }

    function exchangeRateStored() public view returns (uint256) {
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            return initialExchangeRateMantissa;
        }
        uint256 cash = getCash();
        return ((cash + totalBorrows - totalReserves) * MANTISSA) / _totalSupply;
    }

    function exchangeRateCurrent() external returns (uint256) {
        accrueInterest();
        return exchangeRateStored();
    }

    function borrowBalanceStored(address account) public view returns (uint256) {
        BorrowSnapshot memory bs = accountBorrows[account];
        if (bs.principal == 0) return 0;
        // scale principal sesuai perubahan borrowIndex
        return (bs.principal * borrowIndex) / (bs.interestIndex == 0 ? MANTISSA : bs.interestIndex);
    }

    function borrowBalanceCurrent(address account) external returns (uint256) {
        accrueInterest();
        return borrowBalanceStored(account);
    }

    // =========================
    // Interest accrual
    // =========================

    // Struct untuk mengurangi "stack too deep"
    struct AccrueVars {
        uint256 currentBlock;
        uint256 cashPrior;
        uint256 borrowRatePerBlock;
        uint256 interestAccumulated;
        uint256 totalBorrowsNew;
        uint256 totalReservesNew;
        uint256 borrowIndexNew;
    }

    function accrueInterest() public {
        AccrueVars memory v;

        v.currentBlock = block.number;
        uint256 accrualBlockPrior = accrualBlockNumber;

        if (v.currentBlock == accrualBlockPrior) {
            return;
        }

        v.cashPrior = getCash();
        uint256 borrowsPrior = totalBorrows;
        uint256 reservesPrior = totalReserves;

        {
            uint256 deltaBlocks = v.currentBlock - accrualBlockPrior;

            // Borrow rate per block (1e18)
            v.borrowRatePerBlock = interestRateModel.getBorrowRate(
                v.cashPrior,
                borrowsPrior,
                reservesPrior
            );

            uint256 simpleInterestFactor = v.borrowRatePerBlock * deltaBlocks;

            // Accrued interest = borrows * rate
            uint256 interestAccumulated = (simpleInterestFactor * borrowsPrior) / MANTISSA;
            v.interestAccumulated = interestAccumulated;

            v.totalBorrowsNew = borrowsPrior + interestAccumulated;

            uint256 reservesAdded = (interestAccumulated * reserveFactorMantissa) / MANTISSA;
            v.totalReservesNew = reservesPrior + reservesAdded;

            v.borrowIndexNew = borrowIndex + (borrowIndex * simpleInterestFactor) / MANTISSA;
        }

        // Store updates
        accrualBlockNumber = v.currentBlock;
        borrowIndex = v.borrowIndexNew;
        totalBorrows = v.totalBorrowsNew;
        totalReserves = v.totalReservesNew;

        _emitAccrueInterest(v);
    }

    function _emitAccrueInterest(AccrueVars memory v) internal {
        emit AccrueInterest(
            v.cashPrior,
            v.totalBorrowsNew,
            v.totalReservesNew,
            v.borrowIndexNew,
            v.currentBlock,
            v.borrowRatePerBlock,
            v.interestAccumulated
        );
    }

    // =========================
    // Supply: mint/redeem
    // =========================

    // Menyetor underlying untuk menerima CToken
    function mint(uint256 mintAmount) external {
        require(mintAmount > 0, "CToken: mint 0");
        accrueInterest();

        uint256 exRate = exchangeRateStored(); // 1 cToken = exRate underlying
        uint256 mintTokens = (mintAmount * MANTISSA) / exRate;

        // Transfer underlying dari pengguna ke kontrak
        underlying.safeTransferFrom(msg.sender, address(this), mintAmount);

        // Mint CToken ke pengguna
        _mint(msg.sender, mintTokens);

        emit Mint(msg.sender, mintAmount, mintTokens);
    }

    // Menukarkan CToken menjadi underlying
    function redeem(uint256 redeemTokens) external {
        require(redeemTokens > 0, "CToken: redeem 0");
        accrueInterest();

        uint256 exRate = exchangeRateStored();
        uint256 redeemAmount = (redeemTokens * exRate) / MANTISSA;
        require(getCash() >= redeemAmount, "CToken: insufficient cash");

        _burn(msg.sender, redeemTokens);
        underlying.safeTransfer(msg.sender, redeemAmount);

        emit Redeem(msg.sender, redeemTokens, redeemAmount);
    }

    // =========================
    // Borrow / Repay
    // =========================

    function borrow(uint256 borrowAmount) external {
        require(borrowAmount > 0, "CToken: borrow 0");
        accrueInterest();

        // Cek izin via Comptroller
        uint256 allowed = comptroller.borrowAllowed(address(this), msg.sender, borrowAmount);
        require(allowed == 0, "CToken: borrow not allowed");

        require(getCash() >= borrowAmount, "CToken: insufficient cash");

        // Update snapshot pinjaman peminjam
        BorrowSnapshot storage bs = accountBorrows[msg.sender];
        uint256 principalPrior = bs.principal == 0
            ? 0
            : (bs.principal * borrowIndex) / (bs.interestIndex == 0 ? MANTISSA : bs.interestIndex);
        uint256 principalNew = principalPrior + borrowAmount;

        bs.principal = principalNew;
        bs.interestIndex = borrowIndex;

        // Update total borrows
        totalBorrows += borrowAmount;

        // Transfer underlying ke peminjam
        underlying.safeTransfer(msg.sender, borrowAmount);

        emit Borrow(msg.sender, borrowAmount, principalNew, totalBorrows);
    }

    function repayBorrow(uint256 repayAmount) external {
        require(repayAmount > 0, "CToken: repay 0");
        accrueInterest();

        BorrowSnapshot storage bs = accountBorrows[msg.sender];
        uint256 accountOwes = borrowBalanceStored(msg.sender);
        require(accountOwes > 0, "CToken: no debt");

        uint256 actualRepay = repayAmount > accountOwes ? accountOwes : repayAmount;

        // Transfer underlying dari payer
        underlying.safeTransferFrom(msg.sender, address(this), actualRepay);

        // Update snapshot: kurangi principal ke sisa
        uint256 newPrincipal = accountOwes - actualRepay;
        bs.principal = newPrincipal;
        bs.interestIndex = borrowIndex;

        // Update total borrows
        totalBorrows -= actualRepay;

        emit RepayBorrow(msg.sender, msg.sender, actualRepay, newPrincipal, totalBorrows);
    }

    // =========================
    // Admin-lite (optional)
    // =========================

    // Ubah reserve factor (jika nanti butuh kontrol)
    function _setReserveFactor(uint256 newReserveFactorMantissa) external {
        // Untuk sederhana, izinkan siapa pun pada PoC ini; di produksi tambahkan onlyAdmin
        require(newReserveFactorMantissa <= MANTISSA, "CToken: bad reserve factor");
        uint256 old = reserveFactorMantissa;
        reserveFactorMantissa = newReserveFactorMantissa;
        emit NewReserveFactor(old, newReserveFactorMantissa);
    }

    // definisi modifier (jika belum ada)
    modifier onlyAdmin() {
    require(msg.sender == admin, "CToken: only admin");
     _;
    }

     // lalu fungsi: tambahkan modifier onlyAdmin
    function _setReserveFactor(uint256 newReserveFactorMantissa) external onlyAdmin {
    require(newReserveFactorMantissa <= MANTISSA, "CToken: bad reserve factor");
    uint256 old = reserveFactorMantissa;
    reserveFactorMantissa = newReserveFactorMantissa;
    emit NewReserveFactor(old, newReserveFactorMantissa);
}

}