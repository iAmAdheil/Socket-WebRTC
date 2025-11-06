import { useState, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import UsernameModal from "@/components/UsernameModal";
import RoomLobby from "@/components/RoomLobby";
import RoomView from "@/components/RoomView";
import { config } from "@/../utils";

type AppState = "username" | "lobby" | "room";

export interface Room {
  id: string;
  name: string;
  activeUsers: string[];
}

export interface RoomUser {
  id: string;
  username: string;
  videoStream: MediaStream | null;
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

  useEffect(() => {
    const startListening = async () => {
      console.log("activating socket!");
      socketRef.current = io("http://localhost:3000", {
        auth: {
          username: username,
        },
      });

      socketRef.current?.on("fetch active rooms", (roomsStr) => {
        const rooms = JSON.parse(roomsStr) as Room[];
        setRooms(rooms);
      });

      socketRef.current?.on("add new room user", (userStr) => {
        const user = JSON.parse(userStr) as RoomUser;
        setRoomUsers((prev) => {
          const updated = [...prev, user];
          return updated;
        });
      });

      socketRef.current?.on("fetch room users", async (usersStr) => {
        const users = JSON.parse(usersStr) as RoomUser[];
        setRoomUsers((_) => {
          return [
            ...users,
            {
              id: socketRef.current?.id || "",
              username: username,
              videoStream: null,
            },
          ];
        });
        setAppState("room");

        for (const user of users) {
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
          const pc = createPC(data.from);
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          streamRef.current
            ?.getTracks()
            .forEach((track) => pc.addTrack(track, streamRef.current!));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit("answer", {
            from: data.from,
            answer: pc.localDescription,
          });
        }
      );

      socketRef.current?.on(
        "answer",
        async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
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
    };

    if (appState === "username" && socketRef.current !== null) {
      socketRef.current?.disconnect();
      socketRef.current = null;
    } else if (socketRef.current === null && appState !== "username") {
      startListening();
    }
  }, [appState, username]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleUsernameSubmit = (name: string) => {
    setUsername(name);
    setAppState("lobby");
  };

  const handleJoinRoom = (roomName: string) => {
    setCurrentRoomName(roomName);
    socketRef.current?.emit("join room", roomName);
  };

  const handleLeaveRoom = () => {
    // setCurrentRoomName("");
    // setAppState("lobby");
    // socketRef.current?.emit("leave room", currentRoomName);
  };

  const handleLogout = () => {
    // setUsername("");
    // setCurrentRoomName("");
    // setAppState("username");
    // socketRef.current?.disconnect();
  };

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
    streamRef.current
      .getTracks()
      .forEach((t) => pc.addTrack(t, streamRef.current as MediaStream));

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
        />
      )}
    </>
  );
};

export default Index;
