// Kita akan menggunakan library ethers yang sudah ada di node_modules
const ethers = require('ethers');

// --- KONFIGURASI ---

// Gunakan private key dari wallet tes yang sudah kita siapkan.
// JANGAN GUNAKAN PRIVATE KEY ASLI ANDA.
const privateKey = '0x93409643a7bb583b126c01f348483176142ba34264bc2d596c9f831e387cd7ee'; 
            
// GANTI PESAN INI DENGAN PESAN YANG ANDA DAPATKAN DARI ENDPOINT /auth/signin
const messageToSign = "Selamat datang di KaiaLink! Silakan tanda tangani pesan ini untuk login. Nonce: 43793ff8-3830-4a9c-827f-508f30b3abe7"; 

// --- SELESAI KONFIGURASI ---

async function signMessage() {
  if (messageToSign === '') {
    console.error("\n!!! KESALAHAN: Tolong edit file sign-test.js dan ganti nilai 'messageToSign' dengan pesan yang Anda dapatkan dari API.");
    return;
  }
  
  // Membuat instance wallet dari private key
  const wallet = new ethers.Wallet(privateKey);
  
  console.log("Alamat yang digunakan untuk menandatangani:", wallet.address);
  
  try {
    // Menandatangani pesan
    const signature = await wallet.signMessage(messageToSign);
    
    console.log("\n--- HASIL ---");
    console.log("Pesan yang Ditandatangani:", messageToSign);
    console.log("Signature yang Dihasilkan:", signature);
    console.log("\n>>> Salin (copy) signature di atas dan gunakan di endpoint /auth/verify. <<<");

  } catch (error) {
    console.error("Terjadi error saat menandatangani pesan:", error.message);
  }
}

signMessage();