// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IKaiaLinkFactory {
function getPair(address tokenA, address tokenB) external view returns (address pair);
function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IKaiaLinkPair {
function token0() external view returns (address);
function token1() external view returns (address);
function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
function mint(address to) external returns (uint256 liquidity);
}

interface IWETH is IERC20 {
function deposit() external payable;
function withdraw(uint wad) external;
}

contract KaiaLinkRouter {
using SafeERC20 for IERC20;

address public immutable factory;
address public immutable WETH;

modifier ensure(uint deadline) {
    require(deadline >= block.timestamp, "KaiaLinkRouter: EXPIRED");
    _;
}

constructor(address _factory, address _WETH) {
    require(_factory != address(0) && _WETH != address(0), "KaiaLinkRouter: ZERO_ADDR");
    factory = _factory;
    WETH = _WETH;
}

receive() external payable {
    // hanya WETH yang boleh kirim ETH (unwrap)
    assert(msg.sender == WETH);
}

// =================================================================
// =========         FUNGSI MANAJEMEN LIKUIDITAS           =========
// =================================================================

function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
) external ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
    require(to != address(0), "KaiaLinkRouter: INVALID_TO");

    (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);

    address pair = pairFor(factory, tokenA, tokenB);
    require(pair != address(0), "KaiaLinkRouter: PAIR_MISSING");

    _pullToPair(tokenA, pair, amountA);
    _pullToPair(tokenB, pair, amountB);

    liquidity = IKaiaLinkPair(pair).mint(to);
}

function addLiquidityETH(
    address token,
    uint amountTokenDesired,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
) external payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
    require(to != address(0), "KaiaLinkRouter: INVALID_TO");

    (amountToken, amountETH) = _addLiquidity(token, WETH, amountTokenDesired, msg.value, amountTokenMin, amountETHMin);

    address pair = pairFor(factory, token, WETH);
    require(pair != address(0), "KaiaLinkRouter: PAIR_MISSING");

    _pullToPair(token, pair, amountToken);
    _wrapAndSendETH(amountETH, pair);

    liquidity = IKaiaLinkPair(pair).mint(to);

    if (msg.value > amountETH) {
        (bool ok, ) = msg.sender.call{value: msg.value - amountETH}("");
        require(ok, "KaiaLinkRouter: REFUND_FAILED");
    }
}

// =================================================================
// =========               FUNGSI UNTUK SWAP               =========
// =================================================================

function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external ensure(deadline) returns (uint[] memory amounts) {
    require(to != address(0), "KaiaLinkRouter: INVALID_TO");

    amounts = getAmountsOut(factory, amountIn, path);
    require(amounts[amounts.length - 1] >= amountOutMin, "KaiaLinkRouter: INSUFFICIENT_OUTPUT_AMOUNT");

    address pair = pairFor(factory, path[0], path[1]);
    _pullToPair(path[0], pair, amounts[0]);

    _swap(amounts, path, to);
}

function swapExactETHForTokens(
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external payable ensure(deadline) returns (uint[] memory amounts) {
    require(to != address(0), "KaiaLinkRouter: INVALID_TO");
    require(path.length >= 2 && path[0] == WETH, "KaiaLinkRouter: INVALID_PATH");

    amounts = getAmountsOut(factory, msg.value, path);
    require(amounts[amounts.length - 1] >= amountOutMin, "KaiaLinkRouter: INSUFFICIENT_OUTPUT_AMOUNT");

    _wrapAndSendETH(amounts[0], pairFor(factory, path[0], path[1]));

    _swap(amounts, path, to);
}

function swapExactTokensForETH(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external ensure(deadline) returns (uint[] memory amounts) {
    require(to != address(0), "KaiaLinkRouter: INVALID_TO");
    require(path.length >= 2 && path[path.length - 1] == WETH, "KaiaLinkRouter: INVALID_PATH");

    amounts = getAmountsOut(factory, amountIn, path);
    require(amounts[amounts.length - 1] >= amountOutMin, "KaiaLinkRouter: INSUFFICIENT_OUTPUT_AMOUNT");

    address pair = pairFor(factory, path[0], path[1]);
    _pullToPair(path[0], pair, amounts[0]);

    _swap(amounts, path, address(this));
    IWETH(WETH).withdraw(amounts[amounts.length - 1]);

    (bool ok, ) = payable(to).call{value: amounts[amounts.length - 1]}("");
    require(ok, "KaiaLinkRouter: ETH_SEND_FAILED");
}

// =================================================================
// =========               FUNGSI INTERNAL                 =========
// =================================================================

function _swap(uint[] memory amounts, address[] calldata path, address _to) internal virtual {
    require(path.length >= 2, "KaiaLinkRouter: INVALID_PATH");
    for (uint i; i < path.length - 1; i++) {
        (address input, address output) = (path[i], path[i + 1]);
        address pair = pairFor(factory, input, output);

        (uint amount0Out, uint amount1Out) = input == IKaiaLinkPair(pair).token0()
            ? (uint(0), amounts[i + 1])
            : (amounts[i + 1], uint(0));

        address to = i < path.length - 2
            ? pairFor(factory, output, path[i + 2])
            : _to;

        IKaiaLinkPair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
    }
}

function _addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin
) internal virtual returns (uint amountA, uint amountB) {
    require(tokenA != address(0) && tokenB != address(0), "KaiaLinkRouter: ZERO_TOKEN");

    address pair = pairFor(factory, tokenA, tokenB);
    if (pair == address(0)) {
        pair = IKaiaLinkFactory(factory).createPair(tokenA, tokenB);
    }

    (uint reserveA, uint reserveB) = getReserves(factory, tokenA, tokenB);

    if (reserveA == 0 && reserveB == 0) {
        (amountA, amountB) = (amountADesired, amountBDesired);
    } else {
        uint amountBOptimal = quote(amountADesired, reserveA, reserveB);
        if (amountBOptimal <= amountBDesired) {
            require(amountBOptimal >= amountBMin, "KaiaLinkRouter: INSUFFICIENT_B_AMOUNT");
            (amountA, amountB) = (amountADesired, amountBOptimal);
        } else {
            uint amountAOptimal = quote(amountBDesired, reserveB, reserveA);
            require(amountAOptimal <= amountADesired, "KaiaLinkRouter: INSUFFICIENT_A_AMOUNT");
            require(amountAOptimal >= amountAMin, "KaiaLinkRouter: INSUFFICIENT_A_AMOUNT");
            (amountA, amountB) = (amountAOptimal, amountBDesired);
        }
    }
}

// =================================================================
// =========         HELPER: TRANSFER & WRAP/UNWRAP        =========
// =================================================================

function _pullToPair(address token, address pair, uint amount) internal {
    if (amount > 0) {
        IERC20(token).safeTransferFrom(msg.sender, pair, amount);
    }
}

function _wrapAndSendETH(uint amountETH, address pair) internal {
    if (amountETH > 0) {
        IWETH(WETH).deposit{value: amountETH}();
        IERC20(WETH).safeTransfer(pair, amountETH);
    }
}

// =================================================================
// =========           HELPER: MATH & RESERVES             =========
// =================================================================

function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
    require(amountIn > 0, "KaiaLinkRouter: INSUFFICIENT_INPUT_AMOUNT");
    require(reserveIn > 0 && reserveOut > 0, "KaiaLinkRouter: INSUFFICIENT_LIQUIDITY");

    // 0.3% fee
    uint amountInWithFee = amountIn * 997;
    uint numerator = amountInWithFee * reserveOut;
    uint denominator = (reserveIn * 1000) + amountInWithFee;
    amountOut = numerator / denominator;
}

function getReserves(address _factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
    address pair = pairFor(_factory, tokenA, tokenB);
    if (pair == address(0)) return (0, 0);

    (uint112 reserve0, uint112 reserve1, ) = IKaiaLinkPair(pair).getReserves();
    (address token0, ) = sortTokens(tokenA, tokenB);

    if (tokenA == token0) {
        reserveA = uint(reserve0);
        reserveB = uint(reserve1);
    } else {
        reserveA = uint(reserve1);
        reserveB = uint(reserve0);
    }
}

function getAmountsOut(address _factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts) {
    require(path.length >= 2, "KaiaLinkRouter: INVALID_PATH");
    amounts = new uint[](path.length);
    amounts[0] = amountIn;
    for (uint i = 0; i < path.length - 1; i++) {
        (uint reserveIn, uint reserveOut) = getReserves(_factory, path[i], path[i + 1]);
        require(reserveIn > 0 && reserveOut > 0, "KaiaLinkRouter: INSUFFICIENT_LIQUIDITY");
        amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
    }
}

function pairFor(address _factory, address tokenA, address tokenB) internal view returns (address pair) {
    pair = IKaiaLinkFactory(_factory).getPair(tokenA, tokenB);
}

function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
    require(amountA > 0, "KaiaLinkRouter: INSUFFICIENT_AMOUNT");
    require(reserveA > 0 && reserveB > 0, "KaiaLinkRouter: INSUFFICIENT_LIQUIDITY");
    amountB = (amountA * reserveB) / reserveA;
}

function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
    require(tokenA != tokenB, "KaiaLinkRouter: IDENTICAL_ADDRESSES");
    (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), "KaiaLinkRouter: ZERO_ADDRESS");
}
// =================================================================
// =========      FUNGSI VIEW PUBLIK UNTUK QUOTING       =========
// =================================================================

// TAMBAHKAN FUNGSI INI
function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts) {
    return getAmountsOut(factory, amountIn, path);
}
}
