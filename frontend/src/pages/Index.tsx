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

const Index = () => {
  const [appState, setAppState] = useState<AppState>("username");
  const [username, setUsername] = useState("");
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);

  const socketRef = useRef<Socket>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});

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
      socketRef.current = io("http://10.0.11.158:3000", {
        auth: {
          username: username,
        },
      });

      socketRef.current?.on("fetch active rooms", (roomsStr) => {
        const rooms = JSON.parse(roomsStr) as Room[];
        setRooms(rooms);
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
          return;
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
            return;
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
      if (!socketRef.current || !currentRoomName) return;
      socketRef.current.emit("media state change", {
        roomName: currentRoomName,
        kind,
        enabled,
      });
    },
    [currentRoomName]
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

  const handleJoinRoom = useCallback(
    (roomName: string) => {
      setCurrentRoomName(roomName);
      ensureLocalStream()
        .then(() => {
          socketRef.current?.emit("join room", roomName);
        })
        .catch((error) => {
          console.error(
            "Failed to acquire local media before joining room",
            error
          );
        });
    },
    [ensureLocalStream]
  );

  const handleLeaveRoom = useCallback(() => {
    if (currentRoomName) {
      socketRef.current?.emit("leave room", currentRoomName);
    }

    cleanupPeerConnections();
    stopLocalStream();
    setRoomUsers([]);
    setCurrentRoomName("");
    setAppState("lobby");
  }, [cleanupPeerConnections, currentRoomName, stopLocalStream]);

  const handleLogout = useCallback(() => {
    if (currentRoomName) {
      socketRef.current?.emit("leave room", currentRoomName);
    }

    cleanupPeerConnections();
    stopLocalStream();

    setRoomUsers([]);
    setRooms([]);
    setCurrentRoomName("");
    setUsername("");
    setAppState("username");

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [cleanupPeerConnections, currentRoomName, stopLocalStream]);

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

    return pc;
  }

  return (
    <>
      {appState === "username" && (
        <UsernameModal open={true} onSubmit={handleUsernameSubmit} />
      )}

      {appState === "lobby" && (
        <RoomLobby
          username={username}
          onJoinRoom={handleJoinRoom}
          onLogout={handleLogout}
          rooms={rooms}
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
        />
      )}
    </>
  );
};

export default Index;
