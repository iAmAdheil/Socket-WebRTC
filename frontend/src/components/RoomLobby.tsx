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
    <div className="w-full flex-1 min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex flex-row items-center gap-4">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-primary rounded-md md:rounded-lg flex items-center justify-center shadow-medium">
                <Video className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  VideoChat
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={onLogout}
                className="gap-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 h-full w-full flex flex-col gap-10 md:gap-20 py-8 px-6 sm:px-8 lg:px-12">
        <div className="flex flex-row items-center md:items-start justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Active Rooms
            </h2>
            <p className="hidden md:block text-muted-foreground text-base md:text-lg">
              Join an existing room or create your own to start connecting
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-3 bg-purple-500 hover:bg-purple-400 transition-all shadow-medium hover:shadow-lg rounded-sm text-xs sm:text-sm md:text-[15px] px-4 py-2 duration-200">
                <Plus className="w-4 h-4" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col gap-4 max-w-md backdrop-blur-xl bg-card/95 rounded-lg">
              <DialogHeader className="flex flex-col gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto shadow-medium">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex flex-col gap-0">
                  <DialogTitle className="text-2xl text-center">
                    Create New Room
                  </DialogTitle>
                  <DialogDescription className="text-center text-base">
                    Choose a name for your video chat room
                  </DialogDescription>
                </div>
              </DialogHeader>
              <form
                onSubmit={handleCreateRoom}
                className="w-full flex flex-col gap-4"
              >
                <Input
                  placeholder="Enter room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="px-4 py-6 w-full text-base border-1 focus:border-primary transition-colors"
                  autoFocus
                />
                <Button
                  type="submit"
                  className="w-full py-6 text-base bg-purple-500 hover:bg-purple-400 hover:opacity-90 transition-all shadow-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed duration-200"
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
          <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <div
                key={room.name}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <RoomCard
                  roomName={room.name}
                  activeUsers={room.activeUsers}
                  onJoin={() => onJoinRoom(room.name)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 h-full w-full flex flex-col justify-center items-center gap-8 mx-auto">
            <div className="w-full flex flex-col gap-1 text-center">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                No active rooms
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                Be the first to create a room and start chatting with others
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="flex flex-row items-center gap-3 bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-lg text-xs sm:text-base px-4 py-3 h-fit"
            >
              <Plus className="w-6 h-6" />
              Create First Room
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoomLobby;
