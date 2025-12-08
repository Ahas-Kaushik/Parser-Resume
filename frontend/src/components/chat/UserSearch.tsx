import { useState, useEffect } from 'react';
import { Search, User, X } from 'lucide-react';
import api from '../../lib/api';

interface UserResult {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserSearchProps {
  onSelectUser: (user: UserResult) => void;
}

export const UserSearch = ({ onSelectUser }: UserSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get<UserResult[]>(`/chat/users/search? query=${query}`);
        setResults(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (user: UserResult) => {
    onSelectUser(user);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-white/10 rounded-xl border border-white/20 px-4 py-2">
        <Search className="w-5 h-5 text-white/50 mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users to start a conversation..."
          className="bg-transparent flex-1 text-white placeholder-white/50 outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')}>
            <X className="w-4 h-4 text-white/50 hover:text-white" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden z-50">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-white/50 text-sm">{user.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && query. length >= 2 && results.length === 0 && ! isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center z-50">
          <p className="text-white/50">No users found</p>
        </div>
      )}
    </div>
  );
};