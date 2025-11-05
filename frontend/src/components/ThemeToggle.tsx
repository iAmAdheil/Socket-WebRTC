import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-10 h-10 transition-all duration-300">
        <Sun className="w-4 h-4" color={`${theme === 'dark' ? 'white' : 'black'}`} />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 transition-all duration-300 hover:bg-muted hover:scale-110"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform duration-300" color='white' />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300" color='black' />
      )}
    </Button>
  );
};

export default ThemeToggle;
