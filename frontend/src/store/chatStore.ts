import { create } from 'zustand';
import api from '../lib/api';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  fetchMessages: (isGlobal: boolean, receiverId?: number) => Promise<void>;
  sendMessage: (message: string, isGlobal: boolean, receiverId?: number) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  fetchMessages: async (isGlobal: boolean, receiverId?: number) => {
    set({ isLoading: true });
    try {
      const endpoint = isGlobal
        ? '/chat/global'
        : `/chat/direct/${receiverId}`;
      
      const response = await api.get<ChatMessage[]>(endpoint);
      set({ messages: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ isLoading: false });
    }
  },

  sendMessage: async (message: string, isGlobal: boolean, receiverId?: number) => {
    try {
      const response = await api.post<ChatMessage>('/chat/send', {
        message,
        is_global: isGlobal,
        receiver_id: receiverId,
      });
      
      // Add new message to list
      set((state) => ({
        messages: [...state.messages, response.data],
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));