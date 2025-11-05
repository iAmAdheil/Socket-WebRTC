import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Sparkles } from "lucide-react";

interface UsernameModalProps {
  open: boolean;
  onSubmit: (username: string) => void;
}

const UsernameModal = ({ open, onSubmit }: UsernameModalProps) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md rounded-md border-border/50 shadow-medium backdrop-blur-xl bg-card/95">
        <DialogHeader className="">
          <div className="mx-auto relative">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-medium transform transition-transform hover:scale-105 duration-300">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 animate-pulse">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
          </div>
        </DialogHeader>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to VideoChat
        </h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <Input
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-4 py-6 w-full text-base border-1 focus:border-primary transition-colors"
            autoFocus
          />
          <Button
            type="submit"
            className="w-full py-6 text-base bg-purple-500 hover:bg-purple-400 hover:opacity-90 transition-all shadow-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed duration-200"
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
