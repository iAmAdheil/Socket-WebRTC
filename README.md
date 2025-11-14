# 🖧 Decentralized LAN Communication Suite  
**Peer-to-Peer Chat • Video Calls • File Transfer • Distributed Drive • (Optional) SMTP Mail**  
*A CCN-based communication platform running entirely on a LAN environment.*

---

## 🚀 Overview

This project is a **fully decentralized communication system** built using **Computer Communication Networks (CCN)** concepts.  
Instead of routing communication through heavy centralized servers, devices inside a **Local Area Network (LAN)** communicate **directly** using **P2P connections**.

Think of it as a simplified combination of:

- 🟢 WhatsApp → Messaging  
- 🔵 Zoom → Video/Audio Calls  
- 🟣 AirDrop → File Transfer  
- 🟠 Google Drive → Shared Distributed Storage  
- 🟡 Gmail → Optional SMTP Mail Integration  

But everything runs **peer-to-peer** — private, fast, and independent of the internet.

---

## 🧱 Features

### 1️⃣ Real-Time Chat (P2P)
- One-to-one and group chat.
- Messages sent over **WebRTC Data Channels** → direct device-to-device.
- Zero message storage on the server.
- Automatic fallback via Socket.IO when WebRTC channels fail.

### 2️⃣ Video & Audio Calls (Mini Zoom)
- Real-time media streaming using **WebRTC**.
- Direct encrypted P2P transmission.
- Multi-peer meeting rooms with signaling server coordination.
- Low latency since media does not pass through backend.

### 3️⃣ Fast File Transfer (AirDrop-like)
- Large files split into chunks.
- Chunks transferred via WebRTC Data Channels.
- Receiver reassembles the file in sequence.
- Encryption before sending.
- Real-time progress UI.
- Fallback server upload/download if P2P breaks.

### 4️⃣ Distributed Shared Drive (P2P Google Drive)
- Files encrypted → split into fragments → stored across multiple peers.
- Backend holds metadata mapping fragments to peer devices.
- Redundant fragments ensure availability even when peers go offline.
- Enables a private, self-controlled cloud drive experience inside a LAN.

### 5️⃣ Optional SMTP Email Integration
- Basic email sending using **NodeMailer (SMTP)**.
- Shows integration of classic communication with P2P architecture.

---

## 🏗 System Architecture

### 🔹 Hybrid Client–Server + Peer-to-Peer Model

The backend server performs **only**:
- Peer discovery  
- Room management  
- Forwarding WebRTC signaling messages (SDP offer/answer + ICE candidates)  
- Distributed storage metadata management  

📌 **Actual chat, calls, and file data never go to the server.**  
All real communication is **direct P2P**.

---

## 🛠 Tech Stack

### **Frontend**
- React.js  
- Vite  
- WebRTC (Media Streams + Data Channels)  

### **Backend**
- Node.js  
- Express.js  
- Socket.IO  
- Metadata storage utilities  
- File chunking + encryption utilities  

---

## 🔄 WebRTC Connection Flow

1. Peer A joins a room and creates an **SDP Offer**  
2. Offer is sent to Peer B through the signaling server  
3. Peer B responds with an **SDP Answer**  
4. Both peers exchange **ICE Candidates**  
5. Direct encrypted **P2P channel** established  
6. Chat, calls, files flow directly between peers  

---

## 📁 File Transfer Process

- File is divided into small chunks  
- Chunks are streamed over WebRTC DataChannel  
- Receiver reassembles them in order  
- Encryption ensures privacy  
- Real-time progress tracking  
- Server fallback for failure recovery  

---



## ☁️ Distributed Storage Workflow

1. File encrypted  
2. File split into fragments  
3. Fragments distributed across multiple peer devices  
4. Backend stores mapping:

---
## ▶️ Running the Project

### **Backend**
```bash
cd backend
npm install
node server.js
```
### **Frontend**
```bash
cd frontend
npm install
npm run dev
