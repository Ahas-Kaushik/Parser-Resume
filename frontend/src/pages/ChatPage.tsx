import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import Navbar from '../components/layout/Navbar';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { UserSearch } from '../components/chat/UserSearch';
import { DMConversationList } from '../components/chat/DMConversationList';
import { useChat } from '../hooks/useChat';
import { useAuthStore } from '../store/authStore';

interface SelectedUser {
  id: number;
  name: string;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chatType, setChatType] = useState<'global' | 'direct'>('global');
  const [selectedDMUser, setSelectedDMUser] = useState<SelectedUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useChat(
    chatType === 'global',
    selectedDMUser?.id
  );

  useEffect(() => {
    messagesEndRef. current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message: string) => {
    await sendMessage(message);
  };

  const handleSelectUser = (selectedUser: { id: number; name: string }) => {
    setSelectedDMUser(selectedUser);
  };

  const handleSelectConversation = (userId: number, userName: string) => {
    setSelectedDMUser({ id: userId, name: userName });
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
            onClick={() => {
              setChatType('global');
              setSelectedDMUser(null);
            }}
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
                ?  'bg-purple-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">Direct Messages</span>
          </button>
        </div>

        {/* Chat Layout */}
        <div className={`grid ${chatType === 'direct' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1'} gap-6`}>
          {/* DM Sidebar */}
          {chatType === 'direct' && (
            <div className="md:col-span-1">
              <GlassCard className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Conversations</h3>
                
                {/* User Search */}
                <div className="mb-4">
                  <UserSearch onSelectUser={handleSelectUser} />
                </div>

                {/* Conversation List */}
                <DMConversationList
                  onSelectConversation={handleSelectConversation}
                  selectedUserId={selectedDMUser?.id}
                />
              </GlassCard>
            </div>
          )}

          {/* Chat Container */}
          <div className={chatType === 'direct' ? 'md:col-span-3' : ''}>
            <GlassCard className="h-[600px] flex flex-col p-0">
              {/* Header */}
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    {chatType === 'global'
                      ? 'Global Chat Room'
                      : selectedDMUser
                      ? `Chat with ${selectedDMUser.name}`
                      : 'Select a conversation'}
                  </h2>
                </div>
                <p className="text-white/60 text-sm mt-1">
                  {chatType === 'global'
                    ? 'Chat with everyone in the community'
                    : selectedDMUser
                    ? 'Private conversation'
                    : 'Search for a user or select an existing conversation'}
                </p>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatType === 'direct' && ! selectedDMUser ?  (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <p className="text-white/50">Select a user to start messaging</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <p className="text-white/50">No messages yet.  Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              {(chatType === 'global' || selectedDMUser) && (
                <div className="border-t border-white/20">
                  <ChatInput onSend={handleSend} />
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </GlassLayout>
  );
}