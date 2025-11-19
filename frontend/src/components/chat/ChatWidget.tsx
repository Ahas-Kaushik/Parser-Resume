import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '../../hooks/useChat';

interface ChatWidgetProps {
  isGlobal?: boolean;
  receiverId?: number;
}

export const ChatWidget = ({ isGlobal = true, receiverId }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, sendMessage } = useChat(isGlobal, receiverId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message: string) => {
    await sendMessage(message);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 z-50 group"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] z-50 animate-fadeIn">
      <GlassCard className="h-full flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold text-lg">
              {isGlobal ? 'Global Chat' : 'Direct Message'}
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70 hover:text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/50 text-sm">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} />
      </GlassCard>
    </div>
  );
};