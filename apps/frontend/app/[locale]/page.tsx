'use client';

import { useRouter } from 'next/navigation';
// import { useLiff } from '@/hooks/useLiff';

export default function LandingPage() {
  const router = useRouter();
  // const { login, isLoggedIn } = useLiff();

  // if (isLoggedIn) {
  //   router.push('/home'); // <-- PERIKSA JUGA DI SINI
  // }

  const handleLogin = async () => {
    try {
      console.log('Memulai login dengan LINE...');
      // await login();
      
      // --- INI DIA PERBAIKANNYA ---
      // Ganti tujuan dari '/dashboard' menjadi '/home'
      router.push('/home'); 
      // ----------------------------

    } catch (err) {
      console.error('Login gagal:', err);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 max-w-lg">
        <h1 className="text-4xl font-bold mb-4">Selamat Datang di KaiaLink</h1>
        <p className="text-lg text-gray-600 mb-8">
          Gerbang Anda menuju dunia DeFi yang lebih mudah. Selesaikan misi, kumpulkan poin, dan dapatkan reward.
        </p>
        <button
          onClick={handleLogin}
          className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
        >
          Masuk dengan LINE
        </button>
      </div>
    </main>
  );
}