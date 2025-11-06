import { useState, useRef, useEffect } from "react";
import {
  Video,
  Mic,
  PhoneOff,
  Users,
  Settings,
  MicOff,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./ThemeToggle";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { RoomUser } from "@/pages/Index";

interface RoomViewProps {
  roomName: string;
  username: string;
  participants: RoomUser[];
  onLeave: () => void;
  streamRef: React.MutableRefObject<MediaStream | null>;
}

const RoomView = ({
  roomName,
  username,
  participants,
  onLeave,
  streamRef,
}: RoomViewProps) => {
  const [micMuted, setMicMuted] = useState(false);
  const [isVideo, setIsVideo] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-1 md:grid-cols-2";
    if (count <= 6) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  useEffect(() => {
    if (isVideo) {
      playVideoFromCamera();
    } else {
      stopVideo();
    }
  }, [isVideo]);

  async function playVideoFromCamera() {
    try {
      const constraints = { video: true, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error opening video camera.", error);
    }
  }

  function stopVideo() {
    const stream = videoRef.current.srcObject;
    if (stream && stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    videoRef.current.srcObject = null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
                <Video className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{roomName}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <Badge
                    variant="outline"
                    className="gap-1.5 text-xs border-green-500/20 text-green-600 dark:text-green-400"
                  >
                    <Users className="w-3 h-3" />
                    {participants.length}{" "}
                    {participants.length === 1 ? "participant" : "participants"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Video Grid */}
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 py-10 overflow-auto no-scrollbar">
        <div className={`grid ${getGridCols(participants.length)} gap-8`}>
          {/* Current User Video */}
          <Card className="aspect-video bg-gradient-card relative overflow-hidden group shadow-medium animate-fade-in border-2 border-primary/20">
            {!isVideo && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <div className="text-center flex flex-col gap-2">
                  <Avatar className="w-24 h-24 mx-auto shadow-medium">
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg text-foreground">
                      {username}
                    </p>
                    <p className="text-sm text-muted-foreground">You</p>
                  </div>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-accent text-accent-foreground shadow-medium">
                You
              </Badge>
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div
                className={`w-10 h-10 ${
                  micMuted ? "bg-destructive" : "bg-background/90"
                } backdrop-blur-sm rounded-full flex items-center justify-center shadow-medium`}
              >
                {micMuted ? (
                  <MicOff
                    className="w-4 h-4 text-destructive-foreground"
                    color="white"
                  />
                ) : (
                  <Mic className="w-4 h-4" color="black" />
                )}
              </div>
              <div
                className={`w-10 h-10 ${
                  !isVideo ? "bg-destructive" : "bg-background/90"
                } backdrop-blur-sm rounded-full flex items-center justify-center shadow-medium`}
              >
                {!isVideo ? (
                  <VideoOff className="w-4 h-4 text-destructive-foreground" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </div>
            </div>
          </Card>

          {participants
            .filter((p) => p.username !== username)
            .map((p, index) => (
              <Card
                key={p.id}
                className="aspect-video bg-gradient-card relative overflow-hidden group shadow-medium animate-fade-in hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                {!p.videoStream && (
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center">
                    <div className="text-center flex flex-col gap-2">
                      <Avatar className="w-20 h-20 mx-auto shadow-soft">
                        <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                          {p.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-foreground">
                        {p.username}
                      </p>
                    </div>
                  </div>
                )}
                <video
                  ref={(video) => {
                    if (video) video.srcObject = p.videoStream;
                  }}
                  className="inset-0"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-medium border-2 border-border/50">
                    <Mic className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="w-10 h-10 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-medium border-2 border-border/50">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="border-t border-border/50 bg-card/90 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant={micMuted ? "destructive" : "outline"}
              onClick={() => setMicMuted(!micMuted)}
              className={`w-16 h-16 rounded-full transition-all duration-200 shadow-medium hover:shadow-lg ${
                micMuted
                  ? "bg-destructive hover:bg-destructive/70 text-destructive-foreground"
                  : "hover:bg-primary hover:bg-gray-100"
              }`}
            >
              {micMuted ? (
                <MicOff className="w-6 h-6" color="white" />
              ) : (
                <Mic className="w-6 h-6" color="black" />
              )}
            </Button>
            <Button
              size="lg"
              variant={!isVideo ? "destructive" : "outline"}
              onClick={() => setIsVideo((prevState) => !prevState)}
              className={`w-16 h-16 rounded-full transition-all duration-200 shadow-medium hover:shadow-lg ${
                !isVideo
                  ? "bg-destructive hover:bg-destructive/70 text-destructive-foreground"
                  : "hover:bg-primary hover:bg-gray-100"
              }`}
            >
              {!isVideo ? (
                <VideoOff className="w-6 h-6" color="white" />
              ) : (
                <Video className="w-6 h-6" color="black" />
              )}
            </Button>
            <Button
              size="lg"
              onClick={onLeave}
              className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/70 text-destructive-foreground shadow-medium hover:shadow-lg transition-all duration-200"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RoomView;
