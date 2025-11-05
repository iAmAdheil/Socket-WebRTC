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

const Index = () => {
  const [appState, setAppState] = useState<AppState>("username");
  const [username, setUsername] = useState("");
  // const [currentRoomName, setCurrentRoomName] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);

  const socketRef = useRef<Socket>(null);

  // Mock participants for demo
  const mockParticipants = ["Alice", "Bob", "Charlie"];

  useEffect(() => {
    const startListening = () => {
      console.log("activating socket!");
      socketRef.current = io("http://localhost:3000", {
        auth: {
          username: username,
        },
      });

      socketRef.current?.on("fetch active rooms", (roomsStr) => {
        if (appState === "lobby") {
          const rooms = JSON.parse(roomsStr) as Room[];
          setRooms(rooms);
        }
      });
    };

    if (appState === "username") {
      socketRef.current?.disconnect();
      socketRef.current = null;
    } else {
      startListening();
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [appState, username]);

  const handleUsernameSubmit = (name: string) => {
    setUsername(name);
    setAppState("lobby");
  };

  const handleJoinRoom = (roomName: string) => {
    // setCurrentRoomName(roomName);
    setAppState("room");
  };

  const handleLeaveRoom = () => {
    // setCurrentRoomName("");
    setAppState("lobby");
  };

  const handleLogout = () => {
    setUsername("");
    // setCurrentRoomName("");
    setAppState("username");
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
          participants={[username, ...mockParticipants]}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
};

export default Index;
