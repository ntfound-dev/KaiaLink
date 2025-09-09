// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KaiaLinkPair.sol";

contract KaiaLinkFactory {
event PairCreated(address indexed token0, address indexed token1, address pair, uint);

address public feeTo;
address public feeToSetter;

mapping(address => mapping(address => address)) public getPair;
address[] public allPairs;

constructor(address _feeToSetter) {
    feeToSetter = _feeToSetter;
}

function allPairsLength() external view returns (uint) {
    return allPairs.length;
}

function createPair(address tokenA, address tokenB) external returns (address pair) {
    require(tokenA != tokenB, "KaiaLink: IDENTICAL_ADDRESSES");
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), "KaiaLink: ZERO_ADDRESS");
    require(getPair[token0][token1] == address(0), "KaiaLink: PAIR_EXISTS");

    bytes memory bytecode = type(KaiaLinkPair).creationCode;
    bytes32 salt = keccak256(abi.encodePacked(token0, token1));
    assembly {
        pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }

    // Panggil initialize di pair yang baru dibuat.
    // Pakai interface IKaiaLinkPairInit (bukan IKaiaLinkPair) untuk menghindari konflik dengan Router.
    IKaiaLinkPairInit(pair).initialize(token0, token1);

    getPair[token0][token1] = pair;
    getPair[token1][token0] = pair; // simetris
    allPairs.push(pair);

    emit PairCreated(token0, token1, pair, allPairs.length);
}

function setFeeTo(address _feeTo) external {
    require(msg.sender == feeToSetter, "KaiaLink: FORBIDDEN");
    feeTo = _feeTo;
}

function setFeeToSetter(address _feeToSetter) external {
    require(msg.sender == feeToSetter, "KaiaLink: FORBIDDEN");
    feeToSetter = _feeToSetter;
}
}
