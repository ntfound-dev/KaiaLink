// apps/frontend/stores/useChatStore.ts
import { create } from 'zustand';
import api from '@/lib/api';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  messages: [
    { id: 1, text: 'Halo! Ada yang bisa saya bantu terkait KaiaLink?', sender: 'ai' }
  ],
  isLoading: false,
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  sendMessage: async (text: string) => {
    // 1. Tambahkan pesan pengguna ke state
    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    set((state) => ({ 
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      // 2. Kirim pesan ke backend
      const aiResponseText = await api.sendChatMessage(text); // Fungsi baru di API
      const aiMessage: Message = { id: Date.now() + 1, text: aiResponseText, sender: 'ai' };
      
      // 3. Tambahkan respons AI ke state
      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }));
    } catch (error) {
      // 4. Handle error
      const errorMessage: Message = { id: Date.now() + 1, text: 'Maaf, terjadi kesalahan.', sender: 'ai' };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },
}));