// Kita akan menggunakan library ethers yang sudah ada di node_modules
const ethers = require('ethers');

// --- KONFIGURASI ---

// Gunakan private key dari wallet tes yang sudah kita siapkan.
// JANGAN GUNAKAN PRIVATE KEY ASLI ANDA.
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; 
            
// GANTI PESAN INI DENGAN PESAN YANG ANDA DAPATKAN DARI ENDPOINT /auth/signin
const messageToSign = "Selamat datang di KaiaLink! Silakan tanda tangani pesan ini untuk login. Nonce: ISI DISINI"; 

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