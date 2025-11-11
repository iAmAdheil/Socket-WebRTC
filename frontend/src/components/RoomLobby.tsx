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
      onJoinRoom(roomName);
      setNewRoomName("");
      setCreateDialogOpen(false);
    }
  };

  return (
    <div className="w-full flex-1 min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-background" />
              </div>
              <h1 className="text-lg font-semibold">VideoChat</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{username}</span>
              </div>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Rooms</h2>
            <p className="text-sm text-muted-foreground">
              {rooms.length === 0 
                ? "No active rooms yet" 
                : `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"} available`}
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Room</DialogTitle>
                <DialogDescription>
                  Enter a name for your new video chat room
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <Input
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  autoFocus
                />
                <Button
                  type="submit"
                  className="w-full"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.name}
                roomName={room.name}
                activeUsers={room.activeUsers}
                onJoin={() => onJoinRoom(room.name)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No rooms yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create a room to start a video call with others
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Room
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoomLobby;
