import { useState, useEffect } from "react";
import { Users, ArrowRight, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoomCardProps {
  roomName: string;
  activeUsers: {
    id: string;
    username: string;
  }[];
  onJoin: (password: string) => void;
  joinError?: string;
}

const RoomCard = ({ roomName, activeUsers, onJoin, joinError }: RoomCardProps) => {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleJoinClick = () => {
    setJoinDialogOpen(true);
    setPassword("");
    setError("");
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    onJoin(password.trim());
    // Don't close dialog here - let parent handle success/error
  };

  // Update error when prop changes
  useEffect(() => {
    if (joinError) {
      setError(joinError);
    } else if (!joinError && error) {
      // Clear error when joinError prop is cleared (success case)
      setError("");
    }
  }, [joinError]);

  return (
    <>
      <Card className="group hover:border-foreground/20 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium truncate flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            {roomName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {activeUsers.length} {activeUsers.length === 1 ? "person" : "people"}
              </span>
            </div>
            {activeUsers.length > 0 && (
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 3).map((user, index) => (
                  <Avatar key={index} className="w-6 h-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {activeUsers.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                    <span className="text-[10px] font-medium">
                      +{activeUsers.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={handleJoinClick}
            size="sm"
            className="w-full gap-2"
          >
            Join
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <Dialog 
        open={joinDialogOpen} 
        onOpenChange={(open) => {
          setJoinDialogOpen(open);
          if (!open) {
            // Reset state when dialog closes
            setPassword("");
            setError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
            <DialogDescription>
              Enter the password to join {roomName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim()}
            >
              Join Room
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoomCard;
