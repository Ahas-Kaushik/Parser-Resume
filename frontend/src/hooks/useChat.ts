import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';

export const useChat = (isGlobal: boolean, receiverId?: number) => {
  const { messages, isLoading, fetchMessages, sendMessage } = useChatStore();

  useEffect(() => {
    fetchMessages(isGlobal, receiverId);
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetchMessages(isGlobal, receiverId);
    }, 5000);

    return () => clearInterval(interval);
  }, [isGlobal, receiverId, fetchMessages]);

  return {
    messages,
    isLoading,
    sendMessage: (message: string) => sendMessage(message, isGlobal, receiverId),
  };
};