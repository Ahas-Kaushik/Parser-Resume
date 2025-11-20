import { create } from 'zustand';
import api from '../lib/api';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  fetchMessages: (isGlobal: boolean, receiverId?: number) => Promise<void>;
  sendMessage: (message: string, isGlobal: boolean, receiverId?: number) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  fetchMessages: async (isGlobal: boolean, receiverId?: number) => {
    set({ isLoading: true, error: null });
    try {
      console.log('📨 Fetching messages...', { isGlobal, receiverId });
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found - user not authenticated');
        set({ error: 'Please login to view messages', isLoading: false });
        return;
      }
      
      const endpoint = isGlobal
        ? '/chat/global'
        : `/chat/direct/${receiverId}`;
      
      console.log('📤 Calling:', endpoint);
      const response = await api.get<ChatMessage[]>(endpoint);
      
      console.log('✅ Messages received:', response.data.length);
      set({ messages: response.data, isLoading: false, error: null });
    } catch (error: any) {
      console.error('❌ Failed to fetch messages:', error.response?.data || error.message);
      const errorMsg = error.response?.status === 401 
        ? 'Please login to view messages'
        : 'Failed to load messages';
      set({ isLoading: false, error: errorMsg });
    }
  },

  sendMessage: async (message: string, isGlobal: boolean, receiverId?: number) => {
    try {
      console.log('📤 Sending message...', { message, isGlobal, receiverId });
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found - user not authenticated');
        throw new Error('Please login to send messages');
      }
      
      const response = await api.post<ChatMessage>('/chat/send', {
        message,
        is_global: isGlobal,
        receiver_id: receiverId,
      });
      
      console.log('✅ Message sent successfully');
      
      // Add new message to list
      set((state) => ({
        messages: [...state.messages, response.data],
        error: null,
      }));
    } catch (error: any) {
      console.error('❌ Failed to send message:', error.response?.data || error.message);
      const errorMsg = error.response?.status === 401
        ? 'Please login to send messages'
        : 'Failed to send message';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },
}));