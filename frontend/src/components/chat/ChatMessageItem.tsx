import dayjs from 'dayjs';

interface ChatMessageItemProps {
  content: string;
  senderName: string;
  createdAt: string;
  isOwn?: boolean;
}

export function ChatMessageItem({ content, senderName, createdAt, isOwn = false }: ChatMessageItemProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-md px-4 py-3 rounded-2xl border ${isOwn ? 'bg-surfaceAlt border-border' : 'bg-surface border-border'}`}>
        <p className="text-text">{content}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-text-muted">{senderName}</span>
          <span className="text-xs text-text-muted">{dayjs(createdAt).format('MMM D, HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}