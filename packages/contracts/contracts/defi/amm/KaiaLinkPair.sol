// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface minimal agar Factory bisa memanggil initialize
interface IKaiaLinkPairInit {
function initialize(address _token0, address _token1) external;
}

contract KaiaLinkPair is ERC20 {
using SafeERC20 for IERC20;

// Alamat factory pembuat pair ini (set sekali di constructor)
address public immutable factory;

// Token dalam pasangan (di-sort: token0 < token1)
address public token0;
address public token1;

// Cadangan tersimpan (block timestamp terakhir pakai uint32, ala Uniswap V2)
uint112 private reserve0;
uint112 private reserve1;
uint32  private blockTimestampLast;

// Minimal LP yang di-lock selamanya (tidak bisa diburn)
uint public constant MINIMUM_LIQUIDITY = 10**3;

// Alamat "dead" untuk mengunci MINIMUM_LIQUIDITY (OZ melarang mint ke address(0))
address public constant LP_BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

// Reentrancy lock sederhana
uint private unlocked = 1;
modifier lock() {
    require(unlocked == 1, "KaiaLinkPair: LOCKED");
    unlocked = 0;
    _;
    unlocked = 1;
}

// Events (compatible dengan pola Uniswap V2)
event Mint(address indexed sender, uint amount0, uint amount1);
event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to);
event Sync(uint112 reserve0, uint112 reserve1);

constructor() ERC20("KaiaLink LP Token", "KLP") {
    factory = msg.sender;
}

// Dipanggil sekali oleh Factory setelah kontrak ini dibuat
function initialize(address _token0, address _token1) external {
    require(msg.sender == factory, "KaiaLinkPair: FORBIDDEN");
    // cegah re-init
    require(token0 == address(0) && token1 == address(0), "KaiaLinkPair: ALREADY_INITIALIZED");

    require(_token0 != _token1, "KaiaLinkPair: IDENTICAL_ADDRESSES");
    // Sort tokens agar konsisten
    (address t0, address t1) = _token0 < _token1 ? (_token0, _token1) : (_token1, _token0);
    require(t0 != address(0), "KaiaLinkPair: ZERO_ADDRESS");
    token0 = t0;
    token1 = t1;
}

// Lihat cadangan saat ini
function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
    _reserve0 = reserve0;
    _reserve1 = reserve1;
    _blockTimestampLast = blockTimestampLast;
}

// =============================
// Mint LP setelah deposit token
// Dipanggil Router: Pair sudah menerima token dari user
// =============================
function mint(address to) external lock returns (uint liquidity) {
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    uint balance0 = IERC20(token0).balanceOf(address(this));
    uint balance1 = IERC20(token1).balanceOf(address(this));

    uint amount0 = balance0 - _reserve0;
    uint amount1 = balance1 - _reserve1;

    uint _totalSupply = totalSupply();
    if (_totalSupply == 0) {
        // initial liquidity: sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
        liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
        require(liquidity > 0, "KaiaLinkPair: INSUFFICIENT_LIQUIDITY_MINTED");
        // kunci MINIMUM_LIQUIDITY selamanya (mint ke dead address karena OZ melarang address(0))
        _mint(LP_BURN_ADDRESS, MINIMUM_LIQUIDITY);
    } else {
        // add liquidity proporsional
        uint liquidity0 = (amount0 * _totalSupply) / _reserve0;
        uint liquidity1 = (amount1 * _totalSupply) / _reserve1;
        liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        require(liquidity > 0, "KaiaLinkPair: INSUFFICIENT_LIQUIDITY_MINTED");
    }

    _mint(to, liquidity);
    _update(balance0, balance1);
    emit Mint(msg.sender, amount0, amount1);
}

// =============================
// Burn LP untuk menarik underlying
// Router harus transfer LP ke pair dulu, lalu panggil burn(to)
// =============================
function burn(address to) external lock returns (uint amount0, uint amount1) {
    address _token0 = token0;
    address _token1 = token1;

    uint balance0 = IERC20(_token0).balanceOf(address(this));
    uint balance1 = IERC20(_token1).balanceOf(address(this));
    uint liquidity = balanceOf(address(this));

    uint _totalSupply = totalSupply();
    amount0 = (liquidity * balance0) / _totalSupply;
    amount1 = (liquidity * balance1) / _totalSupply;
    require(amount0 > 0 && amount1 > 0, "KaiaLinkPair: INSUFFICIENT_LIQUIDITY_BURNED");

    _burn(address(this), liquidity);
    IERC20(_token0).safeTransfer(to, amount0);
    IERC20(_token1).safeTransfer(to, amount1);

    // hitung ulang balance setelah transfer
    balance0 = IERC20(_token0).balanceOf(address(this));
    balance1 = IERC20(_token1).balanceOf(address(this));

    _update(balance0, balance1);
    emit Burn(msg.sender, amount0, amount1, to);
}

// =============================
// Swap x*y=k dengan fee 0.3%
// Router sudah kirim token in ke pair sebelum panggil swap
// =============================
function swap(uint amount0Out, uint amount1Out, address to, bytes calldata /*data*/) external lock {
    require(amount0Out > 0 || amount1Out > 0, "KaiaLinkPair: INSUFFICIENT_OUTPUT_AMOUNT");

    // Ambil reserves di awal
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    require(amount0Out < _reserve0 && amount1Out < _reserve1, "KaiaLinkPair: INSUFFICIENT_LIQUIDITY");

    uint balance0;
    uint balance1;

    // Scope untuk _token0/_token1 agar tidak "hidup" lama
    {
        address _token0 = token0;
        address _token1 = token1;
        require(to != _token0 && to != _token1, "KaiaLinkPair: INVALID_TO");

        // kirim output lebih dulu
        if (amount0Out > 0) IERC20(_token0).safeTransfer(to, amount0Out);
        if (amount1Out > 0) IERC20(_token1).safeTransfer(to, amount1Out);

        // cek saldo aktual setelah transfer out (input dari router sudah ada di kontrak)
        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));
    }

    // Hitung jumlah input yang baru masuk
    uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
    uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
    require(amount0In > 0 || amount1In > 0, "KaiaLinkPair: INSUFFICIENT_INPUT_AMOUNT");

    // Terapkan fee 0.3% -> faktor 997/1000
    {
        uint balance0Adjusted = (balance0 * 1000) - (amount0In * 3);
        uint balance1Adjusted = (balance1 * 1000) - (amount1In * 3);
        require(
            balance0Adjusted * balance1Adjusted >= uint(_reserve0) * uint(_reserve1) * 1000 * 1000,
            "KaiaLinkPair: K"
        );
    }

    _update(balance0, balance1);

    // Emit dipisah agar variabel lain sudah out-of-scope, menghindari "stack too deep"
    _emitSwap(amount0In, amount1In, amount0Out, amount1Out, to);
}

function _emitSwap(uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address to) internal {
    emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
}

// =============================
// Internal helpers
// =============================

function _update(uint balance0, uint balance1) private {
    require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "KaiaLinkPair: OVERFLOW");
    uint32 blockTimestamp = uint32(block.timestamp % 2**32);
    reserve0 = uint112(balance0);
    reserve1 = uint112(balance1);
    blockTimestampLast = blockTimestamp;
    emit Sync(reserve0, reserve1);
}

// Babylonian sqrt
function sqrt(uint y) internal pure returns (uint z) {
    if (y > 3) {
        z = y;
        uint x = (y / 2) + 1;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    } else if (y != 0) {
        z = 1;
    }
}
}