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
  const [mailTo, setMailTo] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [sendingMail, setSendingMail] = useState(false);
  const [mailNotice, setMailNotice] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);

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

  const handleSendEmail = useCallback(async () => {
    const to = mailTo.trim();
    const subject = mailSubject.trim();
    const text = mailBody.trim();
    if (!to || !subject || !text) return;
    setSendingMail(true);
    setMailNotice(null);
    try {
      const base = (import.meta as any).env?.VITE_SIGNAL_URL ?? `http://${window.location.hostname}:3000`;
      const resp = await fetch(`${base}/mail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, text })
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to send email");
      }
      setMailNotice(data?.previewUrl ? `Sent (preview): ${data.previewUrl}` : "Email sent");
      setMailTo("");
      setMailSubject("");
      setMailBody("");
    } catch (e: any) {
      setMailNotice(e?.message || "Failed to send email");
    } finally {
      setSendingMail(false);
    }
  }, [mailTo, mailSubject, mailBody]);

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
              <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
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
              <Sheet open={emailOpen} onOpenChange={setEmailOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Email</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                      <SheetHeader>
                        <SheetTitle>Send email</SheetTitle>
                      </SheetHeader>
                    </div>
                    <div className="flex-1 p-4 space-y-2">
                      <Input placeholder="Recipient email" value={mailTo} onChange={(e) => setMailTo(e.target.value)} />
                      <Input placeholder="Subject" value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} />
                      <textarea
                        className="w-full border rounded-md p-2 text-sm bg-background"
                        rows={8}
                        placeholder="Message"
                        value={mailBody}
                        onChange={(e) => setMailBody(e.target.value)}
                      />
                    </div>
                    <div className="p-3 border-t flex items-center gap-2">
                      <Button onClick={handleSendEmail} disabled={sendingMail || !mailTo.trim() || !mailSubject.trim() || !mailBody.trim()}>
                        {sendingMail ? "Sending..." : "Send email"}
                      </Button>
                      {mailNotice && <div className="text-xs text-muted-foreground truncate" title={mailNotice}>{mailNotice}</div>}
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
                {(!p.videoStream || !p.isVideoEnabled) && (
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
                    if (video) {
                      video.srcObject = p.isVideoEnabled ? p.videoStream : null;
                    }
                  }}
                  className="inset-0"
                  autoPlay
                  playsInline
                />
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-medium border-2 border-border/50">
                    {p.isAudioEnabled ? (
                      <Mic className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <MicOff className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="w-10 h-10 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-medium border-2 border-border/50">
                    {p.isVideoEnabled ? (
                      <Video className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <VideoOff className="w-5 h-5 text-destructive" />
                    )}
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
              onClick={() =>
                setMicMuted((prev) => {
                  const next = !prev;
                  onAudioToggle(!next);
                  return next;
                })
              }
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
              onClick={() =>
                setIsVideo((prevState) => {
                  const next = !prevState;
                  onVideoToggle(next);
                  return next;
                })
              }
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
