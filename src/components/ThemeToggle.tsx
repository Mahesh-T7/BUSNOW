import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      className="h-9 w-9 hover:bg-white/10 rounded-xl"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-blue-500" />
      )}
    </Button>
  );
}
