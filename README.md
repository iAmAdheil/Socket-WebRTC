🌐 Project Summary (in plain English)

You’re building a mini communication platform — like a simplified mix of Zoom + Google Drive + WhatsApp + Gmail,
but everything runs peer-to-peer (P2P) using Computer Communication Networks (CCN) concepts.

So instead of depending heavily on big servers, your app makes two (or more) devices talk directly to each other over the network.

🧱 Main Parts (Simple View)
1. 💬 Messaging / Chat

Two users open the same “room”.

They can type and send messages instantly.

Messages go directly from one device to another (not through a central database).

✅ Like a WhatsApp DM — but you built the connection yourself.

2. 📞 Call / Meeting

You use the webcam and microphone.

One user creates a “meeting room”; another joins it.

Your app connects them directly using WebRTC → video and audio flow P2P.

✅ Like a mini Zoom — built by you.

3. 📁 Send Big Files

Instead of uploading to Google Drive, the file is broken into small chunks.

Those chunks are sent directly between devices.

You can see upload and download progress.

✅ Like AirDrop — but over the internet.

4. ☁️ Distributed Cloud Drive (the cool new feature)

You can store files across multiple peers (friends/devices).

Each file is split, encrypted, and parts are sent to different peers.

Later, you can rebuild the file using those pieces.

Even if one peer goes offline, others still have the fragments.

✅ Like a “Peer-to-Peer Google Drive” — you control your data.

5. 📧 Mails (Optional / later)

Add a small “send mail” feature using SMTP (Node.js mailer).

Just to show integration of traditional communication (email) with your network.

✅ Like Gmail built into your system.
