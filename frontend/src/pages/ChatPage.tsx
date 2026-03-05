/**
 * ChatPage — Full featured chat
 * Left panel: Global chat tab + DM conversations list + user search
 * Right panel: Message thread with send box
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Send, Globe, MessageCircle, X, Loader2 } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number | null;
  message: string;
  is_global: boolean;
  created_at: string;
}

interface Conversation {
  user_id: number;
  user_name: string;
  user_role: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface UserResult {
  id: number;
  name: string;
  email: string;
  role: string;
}

type ActiveChat = { type: 'global' } | { type: 'dm'; userId: number; userName: string };

export default function ChatPage() {
  const { user } = useAuthStore();
  const [activeChat, setActiveChat] = useState<ActiveChat>({ type: 'global' });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // User search for new DM
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Fetch messages for current active chat ──────────────────
  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      if (activeChat.type === 'global') {
        const res = await api.get<ChatMessage[]>('/chat/global?limit=100');
        setMessages(res.data);
      } else {
        const res = await api.get<ChatMessage[]>(`/chat/direct/${activeChat.userId}?limit=100`);
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── Fetch conversations list ───────────────────────────────
  const fetchConversations = async () => {
    try {
      const res = await api.get<Conversation[]>('/chat/conversations');
      setConversations(res.data);
    } catch {}
  };

  // Re-fetch on chat switch
  useEffect(() => {
    fetchMessages();
    fetchConversations();

    // Poll every 5 seconds for new messages
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── User search debounce ───────────────────────────────────
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const debounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get<UserResult[]>(`/chat/users/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch {} finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // ── Send message ───────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const payload =
        activeChat.type === 'global'
          ? { message: newMessage.trim(), is_global: true }
          : { message: newMessage.trim(), is_global: false, receiver_id: activeChat.userId };

      const res = await api.post<ChatMessage>('/chat/send', payload);
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      fetchConversations(); // Refresh sidebar after send
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  // ── Start a DM from search ─────────────────────────────────
  const startDM = (u: UserResult) => {
    setActiveChat({ type: 'dm', userId: u.id, userName: u.name });
    setSearchQuery('');
    setSearchResults([]);
  };

  const activeChatName =
    activeChat.type === 'global' ? 'Global Chat' : activeChat.userName;

  return (
    <GlassLayout>
      <Navbar />
      <div className="container mx-auto px-4 py-6 h-[calc(100vh-88px)] flex gap-4">

        {/* ── Left Sidebar ──────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">

          {/* Global Chat button */}
          <button
            onClick={() => setActiveChat({ type: 'global' })}
            className={`flex items-center space-x-3 p-3 rounded-xl transition-all border ${
              activeChat.type === 'global'
                ? 'bg-indigo-500/30 border-indigo-400/60 text-white'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Globe className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">Global Chat</span>
          </button>

          {/* User Search for DM */}
          <div className="relative">
            <div className="flex items-center bg-white/10 border border-white/20 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-white/50 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search users to DM..."
                className="bg-transparent text-white placeholder-white/40 text-sm w-full outline-none"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <X className="w-4 h-4 text-white/50 hover:text-white" />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {(searching || searchResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 border border-white/20 rounded-xl overflow-hidden z-10 shadow-2xl">
                {searching ? (
                  <div className="p-3 text-white/50 text-sm text-center">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-white/50 text-sm text-center">No users found</div>
                ) : (
                  searchResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => startDM(u)}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10 last:border-0"
                    >
                      <p className="text-white text-sm font-medium">{u.name}</p>
                      <p className="text-white/50 text-xs capitalize">{u.role} · {u.email}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* DM Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-1 mb-2">
              Direct Messages
            </p>
            {conversations.length === 0 ? (
              <p className="text-white/30 text-sm px-2">No conversations yet. Search for someone above!</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.user_id}
                  onClick={() => setActiveChat({ type: 'dm', userId: conv.user_id, userName: conv.user_name })}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    activeChat.type === 'dm' && activeChat.userId === conv.user_id
                      ? 'bg-purple-500/30 border-purple-400/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <MessageCircle className="w-4 h-4 text-purple-300 flex-shrink-0" />
                      <span className="text-white text-sm font-medium truncate">{conv.user_name}</span>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-white/40 text-xs mt-1 truncate pl-6">{conv.last_message}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat Panel ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center space-x-3">
            {activeChat.type === 'global'
              ? <Globe className="w-5 h-5 text-indigo-300" />
              : <MessageCircle className="w-5 h-5 text-purple-300" />
            }
            <h2 className="text-white font-semibold text-lg">{activeChatName}</h2>
            {activeChat.type === 'global' && (
              <span className="text-white/40 text-xs ml-auto">Everyone can see this</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30 text-sm">
                No messages yet. Say hello! 👋
              </div>
            ) : (
              messages.map(msg => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isOwn && (
                        <span className="text-white/50 text-xs mb-1 ml-1">{msg.sender_name}</span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm break-words ${
                        isOwn
                          ? 'bg-indigo-500/70 text-white rounded-tr-sm'
                          : 'bg-white/10 text-white/90 rounded-tl-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-white/30 text-[10px] mt-1 mx-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/10 flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={`Message ${activeChatName}...`}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 text-sm outline-none focus:border-indigo-400/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`p-2.5 rounded-xl transition-all ${
                newMessage.trim() && !sending
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>

      </div>
    </GlassLayout>
  );
}