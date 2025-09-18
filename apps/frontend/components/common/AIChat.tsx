// file: apps/frontend/components/common/AIChat.tsx
'use client';

import { useChatStore } from '@/stores/useChatStore';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// Komponen kecil untuk menampilkan ikon Kirim
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export default function AIChat() {
  const { isOpen, toggleChat, messages, sendMessage, isLoading } = useChatStore();
  const [input, setInput] = useState('');

  // Ref untuk elemen div yang berisi pesan
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref untuk elemen input/textarea
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- EFEK UNTUK PENGALAMAN PENGGUNA ---

  // 1. Efek untuk auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. Efek untuk auto-fokus ke input saat chat dibuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100); // Sedikit delay agar transisi selesai
    }
  }, [isOpen]);

  // --- HANDLER ---
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handlePromptStarterClick = (prompt: string) => {
    sendMessage(prompt);
  };
  
  // --- PROMPT STARTERS ---
  const promptStarters = [
    "Apa itu KaiaLink?",
    "Bagaimana cara mendapatkan poin?",
    "Jelaskan misi DeFi yang ada.",
  ];

  // Pastikan ada 'return (' di sini
  return (
    <>
      {/* Tombol Melayang (Floating Action Button) */}
      <button 
        onClick={toggleChat} 
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl z-40 hover:bg-blue-700 transition-transform transform hover:scale-110"
        aria-label="Buka Chat AI"
      >
        🤖
      </button>

      {/* Jendela Chat dengan Transisi */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 origin-bottom-right transition-all duration-300 ease-out transform scale-100 opacity-100">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
            <h3 className="font-bold text-lg text-gray-800">KaiaLink AI Helper</h3>
            <button onClick={toggleChat} className="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          
          {/* Body Pesan */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {/* Gunakan ReactMarkdown untuk merender respons AI */}
                  <div className="prose prose-sm">
                    <ReactMarkdown>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-400 text-sm">AI sedang mengetik...</div>}
            {/* Div kosong untuk target auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Prompt Starters (hanya muncul jika chat baru dimulai) */}
          {messages.length <= 1 && !isLoading && (
            <div className="p-2 border-t">
              <div className="flex flex-wrap gap-2 justify-center">
                {promptStarters.map(prompt => (
                  <button key={prompt} onClick={() => handlePromptStarterClick(prompt)} className="px-3 py-1 bg-gray-100 text-sm text-blue-600 rounded-full hover:bg-blue-100">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t flex items-center bg-gray-50 rounded-b-lg">
            <textarea 
              ref={inputRef}
              className="flex-1 border rounded-l-md p-2 resize-none" 
              placeholder="Ketik pertanyaanmu..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              rows={1}
              style={{ height: 'auto', maxHeight: '100px' }} // Auto-resize
              onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 h-full flex items-center justify-center rounded-r-md hover:bg-blue-700 disabled:bg-blue-300" disabled={isLoading}>
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}