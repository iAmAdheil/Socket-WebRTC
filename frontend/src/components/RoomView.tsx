import { useState, useRef, useEffect, useCallback } from "react";
import {
  Video,
  Mic,
  PhoneOff,
  Users,
  Settings,
  MicOff,
  VideoOff,
  MessageCircle,
  Send,
  Paperclip,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./ThemeToggle";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { RoomUser, type ChatMessage } from "@/pages/Index";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

interface RoomViewProps {
  roomName: string;
  username: string;
  participants: RoomUser[];
  onLeave: () => void;
  streamRef: React.MutableRefObject<MediaStream | null>;
  onVideoToggle: (enabled: boolean) => void;
  onAudioToggle: (enabled: boolean) => void;
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
  onSendFile: (file: File) => Promise<void> | void;
  uploadProgress: number;
  receivedFiles: Array<{ name: string; size: number; url: string }>;
}

const RoomView = ({
  roomName,
  username,
  participants,
  onLeave,
  streamRef,
  onVideoToggle,
  onAudioToggle,
  chatMessages,
  onSendChat,
  onSendFile,
  uploadProgress,
  receivedFiles,
}: RoomViewProps) => {
  const [micMuted, setMicMuted] = useState(false);
  const [isVideo, setIsVideo] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [fileToSend, setFileToSend] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-1 md:grid-cols-2";
    if (count <= 6) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  const playVideoFromCamera = useCallback(async () => {
    try {
      const constraints = { video: true, audio: true };
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error opening video camera.", error);
    }
  }, [streamRef, videoRef]);

  const stopVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isVideo) {
      void playVideoFromCamera();
    } else {
      stopVideo();
    }
  }, [isVideo, playVideoFromCamera, stopVideo]);

  const handleSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    onSendChat(text);
    setChatInput("");
  }, [chatInput, onSendChat]);

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFileToSend(f);
  }, []);

  const handleSendFile = useCallback(() => {
    if (!fileToSend) return;
    void onSendFile(fileToSend);
  }, [fileToSend, onSendFile]);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-background" />
              </div>
              <div>
                <h1 className="text-base font-semibold">{roomName}</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {participants.length} {participants.length === 1 ? "person" : "people"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Chat</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                      <SheetHeader>
                        <SheetTitle>Room chat</SheetTitle>
                      </SheetHeader>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        {chatMessages.map((m) => (
                          <div key={`${m.ts}-${m.id}`} className="flex flex-col">
                            <div className="text-xs text-muted-foreground">
                              {m.username} • {new Date(m.ts).toLocaleTimeString()}
                            </div>
                            <div className="text-sm break-words">{m.text}</div>
                          </div>
                        ))}
                        {chatMessages.length === 0 && (
                          <div className="text-sm text-muted-foreground">No messages yet</div>
                        )}
                        {receivedFiles.length > 0 && (
                          <div className="pt-4 space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Received files</div>
                            {receivedFiles.map((f, idx) => (
                              <div key={`${f.url}-${idx}`} className="flex items-center justify-between gap-2 text-sm">
                                <div className="truncate" title={`${f.name} • ${(f.size/1024/1024).toFixed(2)} MB`}>{f.name}</div>
                                <a href={f.url} download={f.name} className="inline-flex items-center gap-1 text-primary hover:underline">
                                  <Download className="w-4 h-4" /> Download
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-3 border-t">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Type a message"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                        />
                        <Button onClick={handleSend} disabled={!chatInput.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2">
                <input id="file-input" type="file" className="hidden" onChange={handleFilePick} />
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <label htmlFor="file-input" className="cursor-pointer">
                    <span className="inline-flex items-center gap-2"><Paperclip className="w-4 h-4" /> Choose file</span>
                  </label>
                </Button>
                <Button size="sm" onClick={handleSendFile} disabled={!fileToSend} className="gap-2">
                  <Send className="w-4 h-4" /> Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video Grid */}
      <main className="flex-1 container mx-auto px-6 lg:px-8 py-6 overflow-auto">
        <div className={`grid ${getGridCols(participants.length)} gap-4`}>
          {/* Current User Video */}
          <Card className="aspect-video relative overflow-hidden group">
            {!isVideo && (
              <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                <div className="text-center flex flex-col gap-2">
                  <Avatar className="w-16 h-16 mx-auto">
                    <AvatarFallback className="text-2xl">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{username}</p>
                    <p className="text-xs text-muted-foreground">You</p>
                  </div>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute top-3 left-3">
              <div className="px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium">
                You
              </div>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <div
                className={`w-8 h-8 ${
                  micMuted ? "bg-destructive" : "bg-background/80"
                } backdrop-blur-sm rounded-lg flex items-center justify-center`}
              >
                {micMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </div>
              <div
                className={`w-8 h-8 ${
                  !isVideo ? "bg-destructive" : "bg-background/80"
                } backdrop-blur-sm rounded-lg flex items-center justify-center`}
              >
                {!isVideo ? (
                  <VideoOff className="w-4 h-4" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </div>
            </div>
          </Card>

          {participants
            .filter((p) => p.username !== username)
            .map((p) => (
              <Card
                key={p.id}
                className="aspect-video relative overflow-hidden group"
              >
                {(!p.videoStream || !p.isVideoEnabled) && (
                  <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                    <div className="text-center flex flex-col gap-2">
                      <Avatar className="w-16 h-16 mx-auto">
                        <AvatarFallback className="text-2xl">
                          {p.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm">{p.username}</p>
                    </div>
                  </div>
                )}
                <video
                  ref={(video) => {
                    if (video) {
                      video.srcObject = p.isVideoEnabled ? p.videoStream : null;
                    }
                  }}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute top-3 left-3">
                  <div className="px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium">
                    {p.username}
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <div className={`w-8 h-8 ${p.isAudioEnabled ? "bg-background/80" : "bg-destructive"} backdrop-blur-sm rounded-lg flex items-center justify-center`}>
                    {p.isAudioEnabled ? (
                      <Mic className="w-4 h-4" />
                    ) : (
                      <MicOff className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`w-8 h-8 ${p.isVideoEnabled ? "bg-background/80" : "bg-destructive"} backdrop-blur-sm rounded-lg flex items-center justify-center`}>
                    {p.isVideoEnabled ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <VideoOff className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              size="icon"
              variant={micMuted ? "destructive" : "outline"}
              onClick={() =>
                setMicMuted((prev) => {
                  const next = !prev;
                  onAudioToggle(!next);
                  return next;
                })
              }
              className="h-10 w-10 rounded-lg"
            >
              {micMuted ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
            <Button
              size="icon"
              variant={!isVideo ? "destructive" : "outline"}
              onClick={() =>
                setIsVideo((prevState) => {
                  const next = !prevState;
                  onVideoToggle(next);
                  return next;
                })
              }
              className="h-10 w-10 rounded-lg"
            >
              {!isVideo ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <Video className="w-5 h-5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={onLeave}
              className="h-10 w-10 rounded-lg"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
          {fileToSend && (
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-2">Sending: {fileToSend.name} ({(fileToSend.size/1024/1024).toFixed(2)} MB)</div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default RoomView;
