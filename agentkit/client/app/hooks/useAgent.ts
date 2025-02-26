import { useEffect, useState } from "react";

const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<
    { text: string; sender: "user" | "agent" }[]
  >([]);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => console.log("Connected to WebSocket");
    ws.onmessage = (event) => {
      console.log("Event received >>>>", event, JSON.parse(event.data));
      setMessages((prev) => [...prev, { text: event.data, sender: "agent" }]);
    };
    ws.onclose = () => console.log("WebSocket Disconnected");

    setSocket(ws);

    return () => ws.close();
  }, [url]);

  const sendMessage = (message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      setMessages((prev) => [...prev, { text: message, sender: "user" }]);
      console.log("Sending message to backend", message);
      socket.send(message);
    }
  };

  return { messages, sendMessage };
};

export default useWebSocket;
