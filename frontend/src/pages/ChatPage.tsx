import { useState } from 'react';
import { MessageCircle, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import Navbar from '../components/layout/Navbar';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { useChat } from '../hooks/useChat';

export default function ChatPage() {
  const navigate = useNavigate();
  const [chatType, setChatType] = useState<'global' | 'direct'>('global');
  const { messages, sendMessage } = useChat(chatType === 'global', undefined);

  const handleSend = async (message: string) => {
    await sendMessage(message);
  };

  return (
    <GlassLayout>
      <Navbar />

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Chat</h1>
          <p className="text-white/80">Connect with employers and candidates</p>
        </div>

        {/* Chat Type Selector */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setChatType('global')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all ${
              chatType === 'global'
                ? 'bg-indigo-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-semibold">Global Chat</span>
          </button>

          <button
            onClick={() => setChatType('direct')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all ${
              chatType === 'direct'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">Direct Messages</span>
          </button>
        </div>

        {/* Chat Container */}
        <GlassCard className="h-[600px] flex flex-col p-0">
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">
                {chatType === 'global' ? 'Global Chat Room' : 'Direct Messages'}
              </h2>
            </div>
            <p className="text-white/60 text-sm mt-1">
              {chatType === 'global'
                ? 'Chat with everyone in the community'
                : 'Private conversations with specific users'}
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-white/20">
            <ChatInput onSend={handleSend} />
          </div>
        </GlassCard>

        {/* Info Box */}
        {chatType === 'direct' && (
          <GlassCard className="mt-6">
            <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
              <p className="text-sm text-blue-200">
                <strong>Coming Soon:</strong> Direct messaging feature is under development. 
                For now, use the global chat to connect with others!
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </GlassLayout>
  );
}