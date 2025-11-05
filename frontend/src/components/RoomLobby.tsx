import { useState } from "react";
import { Plus, LogOut, Video, User } from "lucide-react";
import { Room } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RoomCard from "./RoomCard";
import ThemeToggle from "./ThemeToggle";

interface RoomLobbyProps {
  username: string;
  onJoinRoom: (roomName: string) => void;
  onLogout: () => void;
  rooms: Room[];
}

const RoomLobby = ({
  username,
  onJoinRoom,
  onLogout,
  rooms,
}: RoomLobbyProps) => {
  const [newRoomName, setNewRoomName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const roomName = newRoomName.trim();
    const exists = rooms.some((room) => room.name === roomName);
    if (exists) {
      alert("Room already exists");
    } else {
      console.log("Creating room:", newRoomName);
      setNewRoomName("");
      setCreateDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
                <Video className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  VideoChat
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-semibold">
                      {username}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={onLogout}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight">Active Rooms</h2>
            <p className="text-muted-foreground text-lg">
              Join an existing room or create your own to start connecting
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="gap-2 bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-lg hover:scale-105 text-base font-semibold h-12 px-6"
              >
                <Plus className="w-5 h-5" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95">
              <DialogHeader className="space-y-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto shadow-medium">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <DialogTitle className="text-2xl text-center">
                  Create New Room
                </DialogTitle>
                <DialogDescription className="text-center text-base">
                  Choose a name for your video chat room
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-5 mt-6">
                <Input
                  placeholder="Enter room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="h-14 text-base border-1 focus:border-primary transition-colors"
                  autoFocus
                />
                <Button
                  type="submit"
                  className="w-full h-14 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={!newRoomName.trim()}
                >
                  Create Room
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms Grid */}
        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.map((room, index) => (
              <div key={room.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <RoomCard
                  roomName={room.name}
                  activeUsers={room.activeUsers}
                  onJoin={() => onJoinRoom(room.name)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <Plus className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No active rooms</h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Be the first to create a room and start chatting with others
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-lg hover:scale-105 text-base font-semibold h-12 px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Room
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoomLobby;
