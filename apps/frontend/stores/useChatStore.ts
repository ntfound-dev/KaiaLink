// file: apps/frontend/stores/useChatStore.ts
import { create } from 'zustand';
// Tidak perlu api.ts lagi untuk ini, kita gunakan fetch langsung

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
    // 1. Ambil histori & tambahkan pesan pengguna
    const currentMessages = get().messages;
    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    
    // Siapkan pesan AI kosong untuk diisi oleh stream
    const aiPlaceholderMessage: Message = { id: Date.now() + 1, text: '', sender: 'ai' };
    
    set({ 
      messages: [...currentMessages, userMessage, aiPlaceholderMessage],
      isLoading: true,
    });

    // 2. Format histori untuk dikirim ke backend
    const history = currentMessages
      .filter(m => m.id !== 1) // Abaikan pesan sambutan awal
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    try {
      // 3. Kirim pesan ke backend dan baca stream
      const response = await fetch('http://localhost:3001/api/ai-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // 4. Proses stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Perbarui pesan AI yang terakhir dengan bongkahan teks baru
        set(state => {
          const newMessages = [...state.messages];
          newMessages[newMessages.length - 1].text += chunk;
          return { messages: newMessages };
        });
      }

    } catch (error) {
      // 5. Handle error
      set(state => {
        const newMessages = [...state.messages];
        newMessages[newMessages.length - 1].text = 'Maaf, terjadi kesalahan.';
        return { messages: newMessages };
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));