import { useState, useEffect } from 'react';
import { User, MessageCircle } from 'lucide-react';
import api from '../../lib/api';

interface Conversation {
  user_id: number;
  user_name: string;
  last_message: string | null;
  last_message_at: string | null;
}

interface DMConversationListProps {
  onSelectConversation: (userId: number, userName: string) => void;
  selectedUserId?: number;
}

export const DMConversationList = ({ onSelectConversation, selectedUserId }: DMConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get<Conversation[]>('/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-white/50">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-3" />
        <p className="text-white/50 text-sm">No conversations yet</p>
        <p className="text-white/40 text-xs mt-1">Search for a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <button
          key={conv.user_id}
          onClick={() => onSelectConversation(conv.user_id, conv.user_name)}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
            selectedUserId === conv.user_id
              ? 'bg-indigo-500/30 border border-indigo-500/50'
              : 'hover:bg-white/10'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-purple-300" />
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-white font-medium truncate">{conv.user_name}</p>
            {conv.last_message && (
              <p className="text-white/50 text-sm truncate">{conv.last_message}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};