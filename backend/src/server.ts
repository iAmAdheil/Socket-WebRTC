// server.ts
import express from "express";
import { Server } from 'socket.io';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpsOptions = {
  key: fs.readFileSync(path.resolve(__dirname, '../../localhost+1-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '../../localhost+1.pem'))
};

const app = express();
const server = https.createServer(httpsOptions, app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

async function getAllRooms(): Promise<Room[]> {
  const rooms: Room[] = [];
  const allRooms = io.of("/").adapter.rooms;

  for (const [roomName, socketIds] of allRooms) {
    // Filter out socket's own rooms (each socket has a room with its ID)
    if (!io.of("/").sockets.has(roomName)) {
      // Get actual socket instances to extract user data
      const sockets = await io.in(roomName).fetchSockets();

      const activeUsers = sockets.map(socket =>
      ({
        id: socket.id,
        username: socket.handshake.auth.username
      })
      );

      rooms.push({
        id: roomName,
        name: roomName, // or extract from roomName if it's like "project:123"
        activeUsers: activeUsers
      });
    }
  }

  return rooms;
}


app.get('/', (req, res) => {
  res.json({
    msg: "Hello World"
  })
});

io.of("/").on("connection", async (socket) => {
  const rooms = await getAllRooms();
  socket.emit("fetch active rooms", JSON.stringify(rooms));
  socket.data.mediaState = {
    videoEnabled: true,
    audioEnabled: true
  };

  socket.on("join room", async (roomName: string) => {
    await socket.join(roomName);
    const rooms = await getAllRooms();
    io.except(roomName).emit("fetch active rooms", JSON.stringify(rooms));

    const newUser: RoomUser = {
      id: socket.id,
      username: socket.handshake.auth.username,
      isVideoEnabled: socket.data.mediaState.videoEnabled ?? true,
      isAudioEnabled: socket.data.mediaState.audioEnabled ?? true
    };
    io.to(roomName).except(socket.id).emit("add new room user", JSON.stringify(newUser));

    const clientIDs = io.sockets.adapter.rooms.get(roomName) || new Set();
    // 2. Prepare an array to hold the client details (ID and Username)
    const clientsWithUsernames = [];
    // 3. Iterate over the client IDs to find the corresponding socket and its handshake data
    for (const clientID of clientIDs) {
      if (clientID === socket.id) continue;
      // Get the actual Socket object for the client ID
      const s = io.sockets.sockets.get(clientID);
      if (s) {
        // Access the username from the handshake.auth object
        // Assuming the client sends { auth: { username: '...' } }
        const username = s.handshake.auth.username;

        clientsWithUsernames.push({
          id: clientID, // socketID
          username: username,
          isVideoEnabled: s.data.mediaState?.videoEnabled ?? true,
          isAudioEnabled: s.data.mediaState?.audioEnabled ?? true,
        });
      }
    }

    socket.emit("fetch room users", JSON.stringify(clientsWithUsernames));
  });

  socket.on("media state change", async (data: { roomName: string, kind: "video" | "audio", enabled: boolean }) => {
    if (data.kind === "video") {
      socket.data.mediaState.videoEnabled = data.enabled;
    } else if (data.kind === "audio") {
      socket.data.mediaState.audioEnabled = data.enabled;
    }
    socket.to(data.roomName).emit("media state change", {
      userId: socket.id,
      kind: data.kind,
      enabled: data.enabled,
    });
  });

  socket.on("offer", async (data: { to: string, offer: RTCSessionDescriptionInit }) => {
    const s = io.sockets.sockets.get(data.to);
    if (s) {
      s.emit("offer", {
        from: socket.id,
        offer: data.offer,
      });
    } else {
      console.log("User not found");
    }
  });

  socket.on("answer", async (data: { to: string, answer: RTCSessionDescriptionInit }) => {
    io.to(data.to).emit("answer", {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on("candidate", async (data: { to: string, candidate: RTCIceCandidateInit }) => {
    io.to(data.to).emit("candidate", {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  socket.on("leave room", async (roomName: string) => {
    if (!roomName) {
      return;
    }

    if (socket.rooms.has(roomName)) {
      socket.to(roomName).emit("remove room user", socket.id);
      await socket.leave(roomName);
    }

    const rooms = await getAllRooms();
    io.emit("fetch active rooms", JSON.stringify(rooms));
  });

  socket.on("disconnecting", () => {
    for (const roomName of socket.rooms) {
      if (roomName === socket.id) continue;
      socket.to(roomName).emit("remove room user", socket.id);
    }
  });

  socket.on("disconnect", async () => {
    const rooms = await getAllRooms();
    io.emit("fetch active rooms", JSON.stringify(rooms));
  });
});


server.listen(3000, '0.0.0.0', () => {
  console.log('server running at https://10.0.11.158:3000');
});