// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// EIP-5192 Minimal SBT interface (interfaceId = 0xb45a3c0e)
interface IERC5192 {
event Locked(uint256 tokenId);
function locked(uint256 tokenId) external view returns (bool);
}

contract SBT is ERC721, AccessControl, IERC5192 {
// Roles
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

// Custom errors
error NonTransferable();
error ZeroAddress();
error AlreadyHasSBT(address owner);
error LengthMismatch();
error NotOwner(uint256 tokenId, address caller);

// Token id auto-increment
uint256 private _nextTokenId = 1;

// URI per token
mapping(uint256 => string) private _tokenURIs;

// 1:1 pemilik -> tokenId (0 bila belum punya)
mapping(address => uint256) private _ownedToken;

constructor(address initialAdmin) ERC721("KaiaLink Level SBT", "KLSBT") {
    address admin = initialAdmin == address(0) ? msg.sender : initialAdmin;
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(MINTER_ROLE, admin);
}

// =========================
// Minting
// =========================

function awardSBT(address to, string calldata uri) public onlyRole(MINTER_ROLE) returns (uint256) {
    return _awardSBT(to, uri);
}

function awardSBTBatch(address[] calldata to, string[] calldata uris) external onlyRole(MINTER_ROLE) {
    uint256 len = to.length;
    if (len != uris.length) revert LengthMismatch();
    for (uint256 i = 0; i < len; ++i) {
        _awardSBT(to[i], uris[i]);
    }
}

function _awardSBT(address to, string calldata uri) internal returns (uint256) {
    if (to == address(0)) revert ZeroAddress();
    if (_ownedToken[to] != 0) revert AlreadyHasSBT(to);

    uint256 tokenId = _nextTokenId++;
    _safeMint(to, tokenId);
    _tokenURIs[tokenId] = uri;

    return tokenId;
}

// =========================
// Metadata
// =========================

function tokenURI(uint256 tokenId) public view override returns (string memory) {
    ownerOf(tokenId); // revert jika token belum ada
    return _tokenURIs[tokenId];
}

function updateTokenURI(uint256 tokenId, string calldata newURI) external onlyRole(MINTER_ROLE) {
    ownerOf(tokenId); // revert jika token tidak ada
    _tokenURIs[tokenId] = newURI;
}

// =========================
// Soulbound enforcement (OZ v5)
// =========================

function _update(address to, uint256 tokenId, address auth)
    internal
    virtual
    override
    returns (address from)
{
    // Blokir transfer antar non-zero sebelum mutasi state
    address prevOwner = _ownerOf(tokenId);
    if (prevOwner != address(0) && to != address(0)) {
        revert NonTransferable();
    }

    from = super._update(to, tokenId, auth);

    if (from == address(0)) {
        // mint
        _ownedToken[to] = tokenId;
        emit Locked(tokenId);
    } else if (to == address(0)) {
        // burn
        if (_ownedToken[from] == tokenId) {
            _ownedToken[from] = 0;
        }
        delete _tokenURIs[tokenId];
    }
}

// =========================
// Blokir approvals (entry-point publik)
// =========================

function approve(address /*to*/, uint256 /*tokenId*/) public virtual override {
    revert NonTransferable();
}

function setApprovalForAll(address /*operator*/, bool /*approved*/) public virtual override {
    revert NonTransferable();
}

// =========================
// Revoke / Renounce (burn)
// =========================

function revoke(uint256 tokenId) external onlyRole(MINTER_ROLE) {
    _burn(tokenId);
}

function renounce(uint256 tokenId) external {
    if (ownerOf(tokenId) != msg.sender) revert NotOwner(tokenId, msg.sender);
    _burn(tokenId);
}

// =========================
// EIP-5192 Minimal SBT
// =========================

function locked(uint256 tokenId) external view override returns (bool) {
    ownerOf(tokenId);
    return true;
}

// =========================
// Utility
// =========================

function sbtOf(address owner) external view returns (uint256) {
    return _ownedToken[owner];
}

// =========================
// Interface support
// =========================

function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, AccessControl)
    returns (bool)
{
    return
        interfaceId == type(IERC5192).interfaceId ||
        super.supportsInterface(interfaceId);
}
}