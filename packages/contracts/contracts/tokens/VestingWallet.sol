// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (finance/VestingWallet.sol)

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title VestingWallet
 * @dev A wallet that holds tokens for a beneficiary and releases them over time.
 * This contract is initializable, allowing it to be used with proxies.
 */
contract VestingWallet {
    event ERC20Released(address indexed token, uint256 amount);

    uint256 private _releasable;
    address private immutable _beneficiary;
    uint64 private immutable _start;
    uint64 private immutable _duration;

    /**
     * @dev Creates a vesting wallet that vests tokens linearly for a beneficiary.
     * @param beneficiaryAddress address of the beneficiary to whom vested tokens are transferred
     * @param startTimestamp vesting start time (in seconds)
     * @param durationSeconds duration of the vesting period in which the tokens will be released over
     */
    constructor(address beneficiaryAddress, uint64 startTimestamp, uint64 durationSeconds) {
        if (beneficiaryAddress == address(0)) {
            revert VestingWalletZeroAddress();
        }
        _beneficiary = beneficiaryAddress;
        _start = startTimestamp;
        _duration = durationSeconds;
    }

    /**
     * @dev The beneficiary of the vested tokens.
     */
    function beneficiary() public view returns (address) {
        return _beneficiary;
    }

    /**
     * @dev The start time of the vesting period.
     */
    function start() public view returns (uint64) {
        return _start;
    }

    /**
     * @dev The duration of the vesting period.
     */
    function duration() public view returns (uint64) {
        return _duration;
    }

    /**
     * @dev Amount of token already released
     */
    function released(address token) public view returns (uint256) {
        return _releasedAmount(token);
    }

    /**
     * @dev Amount of token that can be released at the current time
     */
    function releasable(address token) public view returns (uint256) {
        return _vestedAmount(token, uint64(block.timestamp)) - _releasedAmount(token);
    }

    /**
     * @dev Release the vested tokens for a specific ERC20.
     * @param token The address of the ERC20 token to release.
     */
    function release(address token) public {
        uint256 amount = releasable(token);
        if (amount == 0) {
            revert VestingWalletNoFundsToRelease();
        }
        _release(token, amount);
    }

    /**
     * @dev Calculates the amount of tokens that has already vested.
     * @param token The address of the ERC20 token.
     * @param timestamp The timestamp to calculate the vested amount for.
     */
    function _vestedAmount(address token, uint64 timestamp) internal view returns (uint256) {
        if (timestamp < _start) {
            return 0;
        }
        if (timestamp > _start + _duration) {
            return IERC20(token).balanceOf(address(this)) + _releasedAmount(token);
        }
        uint256 totalAllocation = IERC20(token).balanceOf(address(this)) + _releasedAmount(token);
        return (totalAllocation * (timestamp - _start)) / _duration;
    }

    mapping(address => uint256) private _released;

    function _releasedAmount(address token) internal view returns (uint256) {
        return _released[token];
    }

    function _release(address token, uint256 amount) internal {
        _released[token] += amount;
        emit ERC20Released(token, amount);
        SafeERC20.safeTransfer(IERC20(token), _beneficiary, amount);
    }

    /**
     * @dev The address of the beneficiary is not the zero address.
     */
    error VestingWalletZeroAddress();

    /**
     * @dev There are no funds to release.
     */
    error VestingWalletNoFundsToRelease();
}
