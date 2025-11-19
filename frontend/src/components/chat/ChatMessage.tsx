import { formatDateTime } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import type { ChatMessage as ChatMessageType } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const { user } = useAuthStore();
  const isOwnMessage = user?.id === message.sender_id;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col space-y-1`}>
        {/* Sender Name */}
        {!isOwnMessage && (
          <span className="text-xs text-white/60 px-2">{message.sender_name}</span>
        )}

        {/* Message Bubble */}
        <div
          className={`
            px-4 py-2 rounded-2xl
            ${
              isOwnMessage
                ? 'bg-indigo-500 text-white rounded-br-sm'
                : 'bg-white/20 text-white rounded-bl-sm'
            }
          `}
        >
          <p className="text-sm break-words">{message.message}</p>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-white/50 px-2">
          {formatDateTime(message.created_at)}
        </span>
      </div>
    </div>
  );
};