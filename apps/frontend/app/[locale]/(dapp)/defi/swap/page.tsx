'use client';

// PERBAIKAN: Path impor diubah ke lokasi komponen yang benar, yaitu di dalam /components
import { SwapForm } from "@/components/defi/SwapForm";

export default function SwapPage() {
  return (
    <div>
      {/* Judul dan deskripsi sekarang ada di layout.tsx, jadi di sini fokus pada komponennya */}
      <div className="flex justify-center mt-4">
        <SwapForm />
      </div>
    </div>
  );
}

