import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Sparkles } from 'lucide-react';

interface UsernameModalProps {
  open: boolean;
  onSubmit: (username: string) => void;
}

const UsernameModal = ({ open, onSubmit }: UsernameModalProps) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md border-border/50 shadow-medium backdrop-blur-xl bg-card/95">
        <DialogHeader className="space-y-6">
          <div className="mx-auto relative">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-medium transform transition-transform hover:scale-105 duration-300">
              <Users className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 animate-pulse">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to VideoChat
            </DialogTitle>
            <DialogDescription className="text-center text-base text-muted-foreground">
              Enter your name to join or create a room and start connecting
            </DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-14 text-base border-1 focus:border-primary transition-colors"
              autoFocus
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-14 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!username.trim()}
          >
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameModal;
