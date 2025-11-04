// server.js
import express from "express";
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a new user connected');
  io.emit('new connection', 'a user connected')
  socket.on('disconnect', () => {
    socket.broadcast.emit('user disconnected', 'a user disconnected')
  });
  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', msg);
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
