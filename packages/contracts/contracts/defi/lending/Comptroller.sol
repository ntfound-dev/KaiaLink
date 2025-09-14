// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// optional: jika tidak dipakai, bisa dihapus untuk menghindari import tidak perlu
// import "./CToken.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract Comptroller {
    // ==============
    // Storage & Types
    // ==============
    struct Market {
        bool isListed;
        uint256 collateralFactorMantissa; // 1e18 basis (contoh 0.75e18 = 75%)
    }

    address public admin;

    // cToken => Market info
    mapping(address => Market) public markets;

    // account => cToken => entered?
    mapping(address => mapping(address => bool)) public checkMembership;

    // daftar aset (cToken) yang di-enter oleh akun
    mapping(address => address[]) private accountAssets;

    // batasan maksimal collateral factor (misal 90%)
    uint256 public constant MAX_COLLATERAL_FACTOR_MANTISSA = 0.9e18;

    // ==============
    // Events
    // ==============
    event MarketListed(address indexed cToken);
    event NewCollateralFactor(address indexed cToken, uint256 oldFactorMantissa, uint256 newFactorMantissa);
    event MarketEntered(address indexed cToken, address indexed account);
    event MarketExited(address indexed cToken, address indexed account);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    // ==============
    // Modifiers
    // ==============
    modifier onlyAdmin() {
        require(msg.sender == admin, "Comptroller: only admin");
        _;
    }

    // ==============
    // Constructor
    // ==============
    constructor(address initialAdmin) {
        admin = initialAdmin == address(0) ? msg.sender : initialAdmin;
        emit AdminChanged(address(0), admin);
    }

    // ==============
    // Admin ops
    // ==============

    /**
     * @notice Tambah market baru dengan default collateral factor (misal 50%)
     */
    function _supportMarket(address cToken) external onlyAdmin {
        require(cToken != address(0), "Comptroller: zero cToken");
        Market storage m = markets[cToken];
        require(!m.isListed, "Comptroller: already listed");

        m.isListed = true;
        uint256 oldFactor = m.collateralFactorMantissa;
        m.collateralFactorMantissa = 0.5e18; // default 50%

        emit MarketListed(cToken);
        emit NewCollateralFactor(cToken, oldFactor, m.collateralFactorMantissa);
    }

    /**
     * @notice Set collateral factor untuk market
     * @param cToken alamat market
     * @param newFactorMantissa nilai dalam 1e18 basis (0..1e18), dibatasi MAX_COLLATERAL_FACTOR_MANTISSA
     */
    function setCollateralFactor(address cToken, uint256 newFactorMantissa) external onlyAdmin {
        Market storage m = markets[cToken];
        require(m.isListed, "Comptroller: market not listed");
        require(newFactorMantissa <= MAX_COLLATERAL_FACTOR_MANTISSA, "Comptroller: factor too high");

        uint256 old = m.collateralFactorMantissa;
        m.collateralFactorMantissa = newFactorMantissa;

        emit NewCollateralFactor(cToken, old, newFactorMantissa);
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Comptroller: zero admin");
        emit AdminChanged(admin, newAdmin);
        admin = newAdmin;
    }

    // ==============
    // User ops
    // ==============

    /**
     * @notice Masuk ke beberapa market sekaligus
     * @dev return code per item:
     *      0 = OK, 1 = MARKET_NOT_LISTED, 2 = ALREADY_ENTERED
     */
    function enterMarkets(address[] calldata cTokens) external returns (uint[] memory results) {
        uint256 len = cTokens.length;
        results = new uint[](len);

        for (uint256 i = 0; i < len; ++i) {
            address cToken = cTokens[i];
            Market storage m = markets[cToken];

            if (!m.isListed) {
                results[i] = 1; // MARKET_NOT_LISTED
                continue;
            }
            if (checkMembership[msg.sender][cToken]) {
                results[i] = 2; // ALREADY_ENTERED
                continue;
            }

            checkMembership[msg.sender][cToken] = true;
            accountAssets[msg.sender].push(cToken);
            results[i] = 0;

            emit MarketEntered(cToken, msg.sender);
        }
    }

    /**
     * @notice Keluar dari market tertentu
     * @dev return code: 0 = OK, 1 = NOT_ENTERED
     */
    function exitMarket(address cToken) external returns (uint) {
        if (!checkMembership[msg.sender][cToken]) {
            return 1; // NOT_ENTERED
        }

        // Catatan: Untuk implementasi penuh, sebaiknya dicek:
        // - Tidak ada borrow outstanding pada market tsb
        // - Keluar tidak membuat akun under-collateralized

        // Unset membership
        checkMembership[msg.sender][cToken] = false;

        // Remove dari accountAssets (swap & pop)
        address[] storage assets = accountAssets[msg.sender];
        uint256 len = assets.length;
        for (uint256 i = 0; i < len; ++i) {
            if (assets[i] == cToken) {
                if (i < len - 1) {
                    assets[i] = assets[len - 1];
                }
                assets.pop();
                break;
            }
        }

        emit MarketExited(cToken, msg.sender);
        return 0;
    }

    // ==============
    // Hooks dipanggil CToken
    // ==============

    /**
     * @notice Hook sebelum borrow
     * @dev Minimal check: market harus terdaftar + borrower telah enter market ini
     *      Return 0 jika OK; non-zero untuk error code (1 = MARKET_NOT_LISTED, 2 = NOT_IN_MARKET)
     *      Tambahkan pemeriksaan likuiditas di masa depan (oracle + nilai jaminan)
     */
    function borrowAllowed(address cToken, address borrower, uint /*borrowAmount*/) external view returns (uint) {
        if (!markets[cToken].isListed) {
            return 1; // MARKET_NOT_LISTED
        }
        if (!checkMembership[borrower][cToken]) {
            return 2; // NOT_IN_MARKET
        }
        return 0; // OK
    }

    // ==============
    // Views utilitas
    // ==============

    function getAccountAssets(address account) external view returns (address[] memory) {
        return accountAssets[account];
    }

    function isMarketListed(address cToken) external view returns (bool) {
        return markets[cToken].isListed;
    }

    function collateralFactorMantissa(address cToken) external view returns (uint256) {
        return markets[cToken].collateralFactorMantissa;
    }
        AggregatorV3Interface public oracle;

    function _setPriceOracle(address newOracle) external onlyAdmin {
        oracle = AggregatorV3Interface(newOracle);
    }
}