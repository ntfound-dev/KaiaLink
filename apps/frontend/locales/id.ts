export default {
  // Contoh untuk halaman dashboard/home
  home: {
    welcome: 'Selamat Datang, {name}!',
    summary: 'Ini adalah ringkasan aktivitas Anda di KaiaLink.',
  },
  // Contoh untuk navigasi
  navigation: {
    home: 'Beranda',
    missions: 'Misi',
    profile: 'Profil',
  },
} as const; // 'as const' penting untuk type safety