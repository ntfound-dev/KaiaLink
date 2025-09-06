// components/ui/Modal.tsx
'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  // --- LOGIKA UNTUK TIDAK MERENDER APAPUN JIKA MODAL TERTUTUP ---
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop / Overlay
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
    >
      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat konten di-klik
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        
        {/* Modal Body */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};