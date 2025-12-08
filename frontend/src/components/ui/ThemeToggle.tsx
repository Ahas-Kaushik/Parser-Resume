import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    console.log('Current theme:', theme);  // Debug log
    toggleTheme();
    console.log('Theme toggled! ');  // Debug log
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20"
      title={`Switch to ${theme === 'classic' ? 'minimal' : 'classic'} theme`}
    >
      {theme === 'classic' ? (
        <Moon className="w-5 h-5 text-white" />
      ) : (
        <Sun className="w-5 h-5 text-blue-300" />
      )}
    </button>
  );
};