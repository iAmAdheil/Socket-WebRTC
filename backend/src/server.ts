// server.js
import express from "express";
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

export interface Room {
  id: string;
  name: string;
  activeUsers: string[];
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
        socket.data.username || socket.data.userId || socket.id
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

  socket.on("join room", async (roomName: string) => {
    socket.join(roomName);
    const rooms = await getAllRooms();
    socket.emit("fetch active rooms", JSON.stringify(rooms));
  });
});


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

// import { Server } from "socket.io";

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
// 	cors: { origin: "*" },
// });

// io.on("connection", (socket) => {
// 	console.log("User connected:", socket.id);

// 	socket.on("join", (roomId) => {
// 		socket.join(roomId);
// 		console.log(`User ${socket.id} joined room ${roomId}`);
// 		socket.to(roomId).emit("user-joined", socket.id);
// 	});

// 	socket.on("offer", (data) => {
// 		socket.to(data.roomId).emit("offer", {
// 			sdp: data.sdp,
// 			from: socket.id,
// 		});
// 	});

// 	socket.on("answer", (data) => {
// 		socket.to(data.roomId).emit("answer", {
// 			sdp: data.sdp,
// 			from: socket.id,
// 		});
// 	});

// 	socket.on("ice-candidate", (data) => {
// 		socket.to(data.roomId).emit("ice-candidate", {
// 			candidate: data.candidate,
// 			from: socket.id,
// 		});
// 	});

// 	socket.on("disconnect", () => {
// 		console.log("User disconnected:", socket.id);
// 	});
// });

// server.listen(3000, () => console.log("Signaling server on port 3000"));
