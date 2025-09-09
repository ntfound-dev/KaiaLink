// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title StakingRewards
/// @notice Simple staking contract: stake LP token, dapat reward token (LINKA)
contract StakingRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable lpToken;
    IERC20 public immutable rewardToken; // TOKEN IMBALAN (LINKA)

    // periode reward
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public rewardsDuration = 7 days;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    // events
    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);

    // NOTE: panggil Ownable(msg.sender) supaya owner ter-set ke deployer (fix OZ v5)
    constructor(address _lpToken, address _rewardToken) Ownable(msg.sender) {
        require(_lpToken != address(0) && _rewardToken != address(0), "Zero address");
        lpToken = IERC20(_lpToken);
        rewardToken = IERC20(_rewardToken);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        uint256 timeDelta = lastTimeRewardApplicable() - lastUpdateTime;
        // rewardRate scaled by 1e18 to keep precision
        return rewardPerTokenStored + (timeDelta * rewardRate * 1e18) / _totalSupply;
    }

    /// @notice jumlah reward yang sudah 'earned' untuk account (namun belum diklaim)
    function earned(address account) public view returns (uint256) {
        uint256 perTokenDelta = rewardPerToken() - userRewardPerTokenPaid[account];
        return (_balances[account] * perTokenDelta) / 1e18 + rewards[account];
    }

    /* ========== MUTATIVE ========== */

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply += amount;
        _balances[msg.sender] += amount;
        // transferFrom: user harus approve lpToken dulu ke kontrak ini
        lpToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _totalSupply -= amount;
        _balances[msg.sender] -= amount;
        lpToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            // gunakan safeTransfer untuk kompatibilitas token non-standard
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /* ========== RESTRICTED (OWNER) ========== */

    /// @notice Owner dapat either (1) transfer token ke kontrak manual sebelum panggil notifyRewardAmount
    ///         atau (2) approve lalu panggil notifyRewardAmount(reward). Fungsi ini akan men-transfer sisa
    ///         yang kurang (jika ada).
    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        require(reward > 0, "Reward zero");

        // Cek balance kontrak. Jika kontrak belum punya cukup token untuk men-cover `reward`,
        // mint/owner harus approve supaya kontrak dapat mengambil selisihnya.
        uint256 currentBalance = rewardToken.balanceOf(address(this));
        if (currentBalance < reward) {
            uint256 need = reward - currentBalance;
            // Akan revert jika owner tidak approve atau tidak punya saldo
            rewardToken.safeTransferFrom(msg.sender, address(this), need);
        }

        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;

        emit RewardAdded(reward);
    }

    /// @notice Ubah durasi reward (hanya ketika periode sudah selesai)
    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        require(block.timestamp > periodFinish, "Previous period not finished");
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(_rewardsDuration);
    }

    /* ========== EMERGENCY / HELPERS ========== */

    /// @notice Tarik token yang tidak sengaja terkunci (bukan rewardToken atau lpToken)
    function rescueERC20(address tokenAddress, uint256 amount, address to) external onlyOwner {
        require(tokenAddress != address(lpToken), "Cannot rescue lpToken");
        require(tokenAddress != address(rewardToken), "Cannot rescue rewardToken");
        IERC20(tokenAddress).safeTransfer(to, amount);
    }
}
