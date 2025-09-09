// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface ISBT {
function awardSBT(address to, string calldata uri) external returns (uint256);
function updateTokenURI(uint256 tokenId, string calldata newURI) external;
function sbtOf(address owner) external view returns (uint256);
}

contract PointsMinter is AccessControl {
ISBT public immutable sbt;

bytes32 public constant POINTS_SETTER_ROLE = keccak256("POINTS_SETTER_ROLE");

struct Level {
    uint256 minPoints;
    string uri;
}

Level[] public levels;
mapping(address => uint256) public points;
mapping(address => uint8) public userLevel;

event PointsUpdated(address indexed user, uint256 newPoints, uint8 newLevel);
event Redeemed(address indexed user, uint256 tokenId, uint8 level);

error NoEligibleLevel();
error LevelNotIncreased();

constructor(address sbtAddress, address admin) {
    require(sbtAddress != address(0), "SBT=0");
    sbt = ISBT(sbtAddress);
    address _admin = admin == address(0) ? msg.sender : admin;
    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(POINTS_SETTER_ROLE, _admin);
}

function setLevels(Level[] calldata arr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    delete levels;
    uint256 last = 0;
    for (uint256 i = 0; i < arr.length; i++) {
        require(bytes(arr[i].uri).length > 0, "Empty URI");
        require(arr[i].minPoints > 0, "minPoints=0");
        require(arr[i].minPoints > last, "Not ascending");
        levels.push(Level({minPoints: arr[i].minPoints, uri: arr[i].uri}));
        last = arr[i].minPoints;
    }
}

function setPoints(address user, uint256 newPoints) external onlyRole(POINTS_SETTER_ROLE) {
    points[user] = newPoints;
    uint8 lvl = _computeLevel(newPoints);
    emit PointsUpdated(user, newPoints, lvl);
}

function addPoints(address user, uint256 add) external onlyRole(POINTS_SETTER_ROLE) {
    points[user] += add;
    uint8 lvl = _computeLevel(points[user]);
    emit PointsUpdated(user, points[user], lvl);
}

function redeem() external {
    uint8 newLevel = _computeLevel(points[msg.sender]);
    if (newLevel == 0) revert NoEligibleLevel();

    uint256 tokenId = sbt.sbtOf(msg.sender);
    if (tokenId == 0) {
        tokenId = sbt.awardSBT(msg.sender, levels[newLevel - 1].uri);
        userLevel[msg.sender] = newLevel;
        emit Redeemed(msg.sender, tokenId, newLevel);
    } else {
        if (newLevel <= userLevel[msg.sender]) revert LevelNotIncreased();
        sbt.updateTokenURI(tokenId, levels[newLevel - 1].uri);
        userLevel[msg.sender] = newLevel;
        emit Redeemed(msg.sender, tokenId, newLevel);
    }
}

function _computeLevel(uint256 p) internal view returns (uint8) {
    uint8 lvl = 0;
    for (uint256 i = 0; i < levels.length; i++) {
        if (p >= levels[i].minPoints) {
            lvl = uint8(i + 1);
        } else {
            break;
        }
    }
    return lvl;
}

function levelCount() external view returns (uint256) {
    return levels.length;
}

function previewLevel(address user) external view returns (uint8) {
    return _computeLevel(points[user]);
}

function getLevels() external view returns (Level[] memory arr) {
    arr = new Level[](levels.length);
    for (uint256 i = 0; i < levels.length; i++) {
        arr[i] = levels[i];
    }
}
}