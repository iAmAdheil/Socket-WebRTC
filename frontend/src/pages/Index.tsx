import { useState, useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import UsernameModal from "@/components/UsernameModal";
import RoomLobby from "@/components/RoomLobby";
import RoomView from "@/components/RoomView";
import { config } from "@/../utils";

type AppState = "username" | "lobby" | "room";

export interface Room {
  id: string;
  name: string;
  activeUsers: {
    id: string;
    username: string;
  }[];
}

export interface RoomUser {
  id: string;
  username: string;
  videoStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  ts: number;
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>("username");
  const [username, setUsername] = useState("");
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [joinRoomError, setJoinRoomError] = useState<string>("");
  const [pendingJoinRoom, setPendingJoinRoom] = useState<string | null>(null);

  const socketRef = useRef<Socket>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const dcsRef = useRef<Record<string, RTCDataChannel>>({});
  const currentRoomNameRef = useRef<string>("");
  const incomingRef = useRef<
    Record<
      string,
      {
        name: string;
        size: number;
        chunks: string[];
        receivedBytes: number;
        from: string;
      }
    >
  >({});

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [receivedFiles, setReceivedFiles] = useState<
    Array<{ name: string; size: number; url: string }>
  >([]);

  const ensureLocalStream = useCallback(async () => {
    if (streamRef.current) {
      return streamRef.current;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("Error accessing user media", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const startListening = async () => {
      console.log("activating socket!");
      const SIGNAL_URL = "https://claire-untravelling-ira.ngrok-free.dev";
      // (import.meta as any).env?.VITE_SIGNAL_URL ?? `https://${window.location.hostname}:3000`;
      socketRef.current = io(SIGNAL_URL, {
        auth: {
          username: username,
        },
        extraHeaders: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      socketRef.current?.on("fetch active rooms", (roomsStr) => {
        const rooms = JSON.parse(roomsStr) as Room[];
        setRooms(rooms);
      });

      socketRef.current?.on("join room error", (data: { message: string }) => {
        console.error("Join room error:", data.message);
        setJoinRoomError(data.message);
        setPendingJoinRoom((pendingRoom) => {
          // Show alert if there was an error
          if (pendingRoom) {
            alert(`Failed to join room: ${data.message}`);
          }
          return null;
        });
      });

      socketRef.current?.on("add new room user", (userStr) => {
        const incoming = JSON.parse(userStr) as {
          id: string;
          username: string;
          isVideoEnabled?: boolean;
          isAudioEnabled?: boolean;
        };
        setRoomUsers((prev) => {
          const updated = [
            ...prev,
            {
              id: incoming.id,
              username: incoming.username,
              videoStream: null,
              isVideoEnabled: incoming.isVideoEnabled ?? true,
              isAudioEnabled: incoming.isAudioEnabled ?? true,
            },
          ];
          return updated;
        });
      });

      socketRef.current?.on("fetch room users", async (usersStr) => {
        const users = JSON.parse(usersStr) as Array<{
          id: string;
          username: string;
          isVideoEnabled?: boolean;
          isAudioEnabled?: boolean;
        }>;
        // Clear join error on successful join
        setJoinRoomError("");
        setPendingJoinRoom(null);
        setRoomUsers((_) => {
          return [
            ...users.map((user) => ({
              id: user.id,
              username: user.username,
              videoStream: null,
              isVideoEnabled: user.isVideoEnabled ?? true,
              isAudioEnabled: user.isAudioEnabled ?? true,
            })),
            {
              id: socketRef.current?.id || "",
              username: username,
              videoStream: null,
              isVideoEnabled: true,
              isAudioEnabled: true,
            },
          ];
        });
        setAppState("room");

        try {
          await ensureLocalStream();
        } catch (error) {
          console.error(
            "Failed to prepare local media before creating offers",
            error
          );
          // Continue without local media; join should not be blocked
        }

        for (const user of users) {
          console.log("sending an offer to:", user.id);
          const pc = createPC(user.id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit("offer", {
            to: user.id,
            offer: offer,
          });
        }
      });

      socketRef.current?.on(
        "offer",
        async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
          console.log("received an offer from:", data.from);
          try {
            await ensureLocalStream();
          } catch (error) {
            console.error(
              "Failed to prepare local media before answering offer",
              error
            );
            // Continue answering without local media
          }
          const pc = createPC(data.from);
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit("answer", {
            to: data.from,
            answer: pc.localDescription,
          });
        }
      );

      socketRef.current?.on(
        "answer",
        async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
          console.log("received an answer from:", data.from);
          const pc = pcsRef.current[data.from];
          pc.setRemoteDescription(data.answer);
        }
      );

      socketRef.current?.on("chat message", (msg: ChatMessage) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socketRef.current?.on("candidate", async ({ from, candidate }) => {
        const pc = pcsRef.current[from];
        if (!pc || !candidate) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Error adding ICE candidate", err);
        }
      });

      socketRef.current?.on(
        "media state change",
        (data: {
          userId: string;
          kind: "video" | "audio";
          enabled: boolean;
        }) => {
          setRoomUsers((prev) =>
            prev.map((user) => {
              if (user.id !== data.userId) return user;

              if (data.kind === "video") {
                return { ...user, isVideoEnabled: data.enabled };
              }
              if (data.kind === "audio") {
                return { ...user, isAudioEnabled: data.enabled };
              }
              return user;
            })
          );
        }
      );

      socketRef.current?.on("remove room user", (userId: string) => {
        setRoomUsers((prev) => prev.filter((user) => user.id !== userId));
        const pc = pcsRef.current[userId];
        if (pc) {
          try {
            pc.close();
          } catch (error) {
            console.warn(
              "Error closing RTCPeerConnection for user",
              userId,
              error
            );
          }
          delete pcsRef.current[userId];
        }
      });
    };

    if (appState === "username" && socketRef.current !== null) {
      socketRef.current?.disconnect();
      socketRef.current = null;
    } else if (socketRef.current === null && appState !== "username") {
      startListening();
    }
  }, [appState, ensureLocalStream, username]);

  const cleanupPeerConnections = useCallback(() => {
    Object.values(pcsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch (error) {
        console.warn("Error closing RTCPeerConnection", error);
      }
    });
    pcsRef.current = {};
  }, []);

  const stopLocalStream = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (error) {
        console.warn("Error stopping media track", error);
      }
    });

    streamRef.current = null;
  }, []);

  const broadcastMediaState = useCallback(
    (kind: "video" | "audio", enabled: boolean) => {
      if (!socketRef.current || !currentRoomNameRef.current) return;
      socketRef.current.emit("media state change", {
        roomName: currentRoomNameRef.current,
        kind,
        enabled,
      });
    },
    []
  );

  const handleVideoToggle = useCallback(
    (enabled: boolean) => {
      const stream = streamRef.current;
      if (stream) {
        stream.getVideoTracks().forEach((track) => {
          track.enabled = enabled;
        });
      }

      Object.values(pcsRef.current).forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video") {
            sender.track.enabled = enabled;
          }
        });
      });

      setRoomUsers((prev) =>
        prev.map((user) =>
          user.id === socketRef.current?.id
            ? { ...user, isVideoEnabled: enabled }
            : user
        )
      );

      broadcastMediaState("video", enabled);
    },
    [broadcastMediaState]
  );

  const handleAudioToggle = useCallback(
    (enabled: boolean) => {
      const stream = streamRef.current;
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = enabled;
        });
      }

      Object.values(pcsRef.current).forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "audio") {
            sender.track.enabled = enabled;
          }
        });
      });

      setRoomUsers((prev) =>
        prev.map((user) =>
          user.id === socketRef.current?.id
            ? { ...user, isAudioEnabled: enabled }
            : user
        )
      );

      broadcastMediaState("audio", enabled);
    },
    [broadcastMediaState]
  );

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleUsernameSubmit = useCallback((name: string) => {
    setUsername(name);
    setAppState("lobby");
  }, []);

  const handleCreateRoom = useCallback(
    (roomName: string, password: string) => {
      if (!socketRef.current || !socketRef.current.connected) {
        console.error("Socket not connected when trying to create room");
        alert("Connection error. Please try again.");
        return;
      }

      console.log("Creating room:", roomName);
      currentRoomNameRef.current = roomName;
      setCurrentRoomName(roomName);
      setChatMessages([]);
      setJoinRoomError("");
      setPendingJoinRoom(roomName);

      // Emit create room with password
      socketRef.current.emit("create room", {
        roomName: roomName,
        password: password,
      });

      // Try to prepare media in background, but don't block join flow
      ensureLocalStream().catch((error) => {
        console.error(
          "Failed to acquire local media before creating room",
          error
        );
      });
    },
    [ensureLocalStream]
  );

  const handleJoinRoom = useCallback(
    (roomName: string, password: string) => {
      currentRoomNameRef.current = roomName;
      setCurrentRoomName(roomName);
      setChatMessages([]);
      setJoinRoomError("");
      setPendingJoinRoom(roomName);
      // Emit join with password
      socketRef.current?.emit("join room", {
        roomName: roomName,
        password: password,
      });
      // Try to prepare media in background, but don't block join flow
      ensureLocalStream().catch((error) => {
        console.error(
          "Failed to acquire local media before joining room",
          error
        );
      });
    },
    [ensureLocalStream]
  );

  const handleLeaveRoom = useCallback(() => {
    if (currentRoomNameRef.current) {
      socketRef.current?.emit("leave room", currentRoomNameRef.current);
    }

    cleanupPeerConnections();
    stopLocalStream();
    setRoomUsers([]);
    setChatMessages([]);
    setUploadProgress(0);
    setReceivedFiles([]);
    currentRoomNameRef.current = "";
    setCurrentRoomName("");
    setJoinRoomError("");
    setPendingJoinRoom(null);
    setAppState("lobby");
  }, [cleanupPeerConnections, stopLocalStream]);

  const handleLogout = useCallback(() => {
    if (currentRoomNameRef.current) {
      socketRef.current?.emit("leave room", currentRoomNameRef.current);
    }

    cleanupPeerConnections();
    stopLocalStream();

    setRoomUsers([]);
    setRooms([]);
    setChatMessages([]);
    setUploadProgress(0);
    setReceivedFiles([]);
    currentRoomNameRef.current = "";
    setCurrentRoomName("");
    setUsername("");
    setJoinRoomError("");
    setPendingJoinRoom(null);
    setAppState("username");

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [cleanupPeerConnections, stopLocalStream]);

  function createPC(remoteId: string) {
    const pc = new RTCPeerConnection(config);
    // receive remote tracks (attach to a video element)
    pc.addEventListener("track", (ev) => {
      const remoteStream = ev.streams[0];
      if (!remoteStream) {
        console.log("remote stream is empty!");
      }
      setRoomUsers((prev) => {
        const updated = prev.map((user) => {
          if (user.id === remoteId) {
            return { ...user, videoStream: remoteStream };
          }
          return user;
        });
        return updated;
      });
    });

    pc.addEventListener("icecandidate", (ev) => {
      if (ev.candidate) {
        socketRef.current?.emit("candidate", {
          to: remoteId,
          candidate: ev.candidate,
        });
      }
    });

    // add local audio+video tracks (recommended over addStream)
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((t) => pc.addTrack(t, streamRef.current as MediaStream));
    } else {
      console.warn("No local stream available when creating RTCPeerConnection");
    }

    pcsRef.current[remoteId] = pc;

    // If we are the offerer, create data channel for file transfer
    try {
      const dc = pc.createDataChannel("file-transfer", { ordered: true });
      attachDataChannel(remoteId, dc);
    } catch (error) {
      console.error("Error creating data channel", error);
    }

    // If remote creates a channel
    pc.ondatachannel = (ev) => {
      const dc = ev.channel;
      attachDataChannel(remoteId, dc);
    };

    return pc;
  }

  function attachDataChannel(remoteId: string, dc: RTCDataChannel) {
    dcsRef.current[remoteId] = dc;
    dc.onclose = () => {
      delete dcsRef.current[remoteId];
    };
    dc.onmessage = (ev) => {
      try {
        if (typeof ev.data === "string") {
          const msg = JSON.parse(ev.data);
          if (msg.type === "file-meta") {
            const key = `${remoteId}:${msg.id}`;
            incomingRef.current[key] = {
              name: msg.name,
              size: msg.size,
              chunks: [],
              receivedBytes: 0,
              from: remoteId,
            };
          } else if (msg.type === "file-chunk") {
            const key = `${remoteId}:${msg.id}`;
            const entry = incomingRef.current[key];
            if (!entry) return;
            entry.chunks.push(msg.data as string);
            entry.receivedBytes += msg.byteLength as number;
          } else if (msg.type === "file-complete") {
            const key = `${remoteId}:${msg.id}`;
            const entry = incomingRef.current[key];
            if (!entry) return;
            const blob = assembleBase64Chunks(entry.chunks);
            const url = URL.createObjectURL(blob);
            setReceivedFiles((prev) => [
              ...prev,
              { name: entry.name, size: entry.size, url },
            ]);
            delete incomingRef.current[key];
          }
        }
      } catch (e) {
        console.warn("Error handling data channel message", e);
      }
    };
  }

  function assembleBase64Chunks(chunks: string[]) {
    const parts: BlobPart[] = [];
    for (const b64 of chunks) {
      const bin = atob(b64);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
      parts.push(bytes.buffer);
    }
    return new Blob(parts, { type: "application/octet-stream" });
  }

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  const sendFileToAll = useCallback(async (file: File) => {
    const peers = Object.values(dcsRef.current);
    if (peers.length === 0) return;

    const id = `${Date.now()}`;
    const chunkSize = 16 * 1024;
    let offset = 0;

    const waitForBuffer = async (
      dc: RTCDataChannel,
      maxBuffered = 8 * 1024 * 1024
    ) => {
      if (dc.bufferedAmount < maxBuffered) return;
      return new Promise<void>((resolve) => {
        const handler = () => {
          if (dc.bufferedAmount < maxBuffered) {
            dc.removeEventListener("bufferedamountlow", handler);
            resolve();
          }
        };
        try {
          dc.bufferedAmountLowThreshold = Math.floor(maxBuffered / 2);
        } catch (error) {
          console.error("Error setting buffered amount low threshold", error);
        }
        dc.addEventListener("bufferedamountlow", handler);
      });
    };

    for (const dc of peers) {
      if (dc.readyState === "open") {
        dc.send(
          JSON.stringify({
            type: "file-meta",
            id,
            name: file.name,
            size: file.size,
          })
        );
      }
    }

    while (offset < file.size) {
      const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
      const buf = await slice.arrayBuffer();
      const b64 = arrayBufferToBase64(buf);
      for (const dc of peers) {
        if (dc.readyState === "open") {
          await waitForBuffer(dc);
          dc.send(
            JSON.stringify({
              type: "file-chunk",
              id,
              data: b64,
              byteLength: slice.size,
            })
          );
        }
      }
      offset += slice.size;
      setUploadProgress(Math.floor((offset / file.size) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }

    for (const dc of peers) {
      if (dc.readyState === "open") {
        await waitForBuffer(dc);
        dc.send(JSON.stringify({ type: "file-complete", id }));
      }
    }
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!currentRoomNameRef.current || !socketRef.current) return;
    socketRef.current.emit("chat message", {
      roomName: currentRoomNameRef.current,
      text: trimmed,
    });
  }, []);

  return (
    <>
      {appState === "username" && (
        <UsernameModal open={true} onSubmit={handleUsernameSubmit} />
      )}

      {appState === "lobby" && (
        <RoomLobby
          username={username}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onLogout={handleLogout}
          rooms={rooms}
          joinRoomError={joinRoomError}
          pendingJoinRoom={pendingJoinRoom}
        />
      )}

      {appState === "room" && (
        <RoomView
          roomName={currentRoomName}
          username={username}
          participants={roomUsers}
          onLeave={handleLeaveRoom}
          streamRef={streamRef}
          onVideoToggle={handleVideoToggle}
          onAudioToggle={handleAudioToggle}
          chatMessages={chatMessages}
          onSendChat={sendChatMessage}
          onSendFile={sendFileToAll}
          uploadProgress={uploadProgress}
          receivedFiles={receivedFiles}
        />
      )}
    </>
  );
};

export default Index;
