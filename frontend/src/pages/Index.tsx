import { useState, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import UsernameModal from "@/components/UsernameModal";
import RoomLobby from "@/components/RoomLobby";
import RoomView from "@/components/RoomView";

type AppState = "username" | "lobby" | "room";

export interface Room {
  id: string;
  name: string;
  activeUsers: string[];
}

export interface RoomUser {
  id: string;
  username: string;
}

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // free Google STUN server
  ],
};

const Index = () => {
  const [appState, setAppState] = useState<AppState>("username");
  const [username, setUsername] = useState("");
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);

  const socketRef = useRef<Socket>(null);

  useEffect(() => {
    const startListening = () => {
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

      socketRef.current?.on("fetch room users", (usersStr) => {
        const users = JSON.parse(usersStr) as RoomUser[];
        setRoomUsers(users);
      });

      socketRef.current?.on("add new room user", (userStr) => {
        const user = JSON.parse(userStr) as RoomUser;
        setRoomUsers((prev) => [...prev, user]);
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
    setAppState("room");
    socketRef.current?.emit("join room", roomName);
  };

  const handleLeaveRoom = () => {
    setCurrentRoomName("");
    setAppState("lobby");
    socketRef.current?.emit("leave room", currentRoomName);
  };

  const handleLogout = () => {
    setUsername("");
    setCurrentRoomName("");
    setAppState("username");
    socketRef.current?.disconnect();
  };

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
          roomName="General Discussion"
          username={username}
          participants={roomUsers}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
};

export default Index;
