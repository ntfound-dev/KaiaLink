// components/common/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-100 border-t mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-500">
        <p>&copy; {year} KaiaLink. All Rights Reserved.</p>
        <div className="flex justify-center space-x-4 mt-2">
          {/* --- LOGIKA UNTUK LINK SOSIAL MEDIA ATAU DOKUMENTASI --- */}
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          <a href="https://twitter.com/kaialink" target="_blank" rel="noopener noreferrer" className="hover:underline">Twitter</a>
        </div>
      </div>
    </footer>
  );
}