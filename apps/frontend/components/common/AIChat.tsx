// apps/frontend/components/common/AIChat.tsx
'use client';

import { useChatStore } from '@/stores/useChatStore';
import { useState } from 'react';

export function AIChat() {
  const { isOpen, toggleChat, messages, sendMessage, isLoading } = useChatStore();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <>
      {/* Tombol Melayang (Floating Action Button) */}
      <button 
        onClick={toggleChat} 
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl z-40"
      >
        🤖
      </button>

      {/* Jendela Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b font-bold text-lg">KaiaLink AI Helper</div>
          
          {/* Body Pesan */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-xs p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  {msg.text}
                </p>
              </div>
            ))}
            {isLoading && <p className="text-gray-400">AI is typing...</p>}
          </div>

          {/* Input */}
          <div className="p-4 border-t flex">
            <input 
              type="text" 
              className="flex-1 border rounded-l-md p-2" 
              placeholder="Ketik pertanyaanmu..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded-r-md">Kirim</button>
          </div>
        </div>
      )}
    </>
  );
}