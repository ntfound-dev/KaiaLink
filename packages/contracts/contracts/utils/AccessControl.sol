// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// INILAH CARA YANG BENAR: Impor langsung dari library OpenZeppelin
import "@openzeppelin/contracts/access/AccessControl.sol";

// Contoh referensi ke kontrak lain di protokol Anda
interface IKaiaLinkRouter {
    function pause() external;
    function unpause() external;
}

interface IStakingRewards {
    function pause() external;
    function unpause() external;
}


/**
 * @title EmergencyAdmin
 * @dev Kontrak utilitas terpusat untuk tindakan administratif darurat.
 * Menggunakan sistem peran dari AccessControl OpenZeppelin untuk keamanan.
 * Kontrak ini TIDAK dibuat ulang, melainkan MENGGUNAKAN AccessControl.
 */
contract EmergencyAdmin is AccessControl {

    // Mendefinisikan peran-peran spesifik untuk protokol
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    // Alamat-alamat kontrak penting yang akan dikelola
    address public immutable routerAddress;
    address public immutable stakingAddress;

    /**
     * @dev Constructor
     * @param _initialAdmin Alamat yang akan menjadi admin utama (DEFAULT_ADMIN_ROLE).
     * @param _router Alamat kontrak KaiaLinkRouter.
     * @param _staking Alamat kontrak StakingRewards.
     */
    constructor(address _initialAdmin, address _router, address _staking) {
        routerAddress = _router;
        stakingAddress = _staking;

        // Memberikan peran admin default kepada alamat yang ditentukan saat deploy
        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);

        // Admin juga diberikan peran lain secara default
        _grantRole(PAUSER_ROLE, _initialAdmin);
        _grantRole(FEE_MANAGER_ROLE, _initialAdmin);
    }

    /**
     * @notice Menjeda (pause) semua kontrak utama dalam keadaan darurat.
     * Hanya bisa dipanggil oleh akun dengan PAUSER_ROLE.
     */
    function emergencyPauseAll() external onlyRole(PAUSER_ROLE) {
        // Asumsikan kontrak Router dan Staking punya fungsi `pause()`
        // yang juga dilindungi (misalnya, hanya bisa dipanggil oleh kontrak ini)
        IKaiaLinkRouter(routerAddress).pause();
        IStakingRewards(stakingAddress).pause();
    }

    /**
     * @notice Melanjutkan kembali (unpause) semua kontrak utama.
     * Hanya bisa dipanggil oleh akun dengan PAUSER_ROLE.
     */
    function emergencyUnpauseAll() external onlyRole(PAUSER_ROLE) {
        IKaiaLinkRouter(routerAddress).unpause();
        IStakingRewards(stakingAddress).unpause();
    }

    /**
     * @notice Fungsi untuk mengganti alamat penerima fee di Factory.
     * Hanya bisa dipanggil oleh akun dengan FEE_MANAGER_ROLE.
     */
    function updateFeeReceiver(address newReceiver) external onlyRole(FEE_MANAGER_ROLE) {
        // Logika untuk memanggil `setFeeTo` di kontrak Factory
        // ... (membutuhkan interface Factory)
    }

    // Fungsi-fungsi `grantRole`, `revokeRole`, `renounceRole` sudah otomatis
    // tersedia dari warisan `AccessControl` dan dilindungi oleh `DEFAULT_ADMIN_ROLE`.
}