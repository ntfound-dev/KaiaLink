// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";

contract LinkaTokenPlus is
    ERC20,
    ERC20Burnable,
    ERC20Pausable,
    ERC20Permit,
    ERC20Capped,
    AccessControlDefaultAdminRules
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    error InvalidInitialAdmin();
    error InvalidCap();

    // Set default admin transfer delay = 2 hari (aman operasional)
    constructor(address initialAdmin, uint256 capWei)
        ERC20("KaiaLink Token", "LINKA")
        ERC20Permit("KaiaLink Token")
        ERC20Capped(capWei)
        AccessControlDefaultAdminRules(2 days, initialAdmin)
    {
        if (initialAdmin == address(0)) revert InvalidInitialAdmin();
        if (capWei == 0) revert InvalidCap();

        _grantRole(MINTER_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Kombinasi Pausable + Capped
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20Capped)
    {
        super._update(from, to, value);
    }
}

