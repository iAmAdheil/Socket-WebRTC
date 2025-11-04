import { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";

function App() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket>(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    // Listen for messages from server
    socketRef.current?.on("new connection", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    socketRef.current?.on("chat message", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    socketRef.current?.on("user disconnected", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.off("message");
    };
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      socketRef.current?.emit("chat message", input);
      setInput("");
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
