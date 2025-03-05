import { useEffect, useState } from "react";

const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<
    { text: string; sender: "user" | "agent" }[]
  >([]);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => console.log("Connected to WebSocket");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "agent_response") {
        setMessages((prev) => [
          ...prev,
          { text: data.message, sender: "agent" },
        ]);
        setIsThinking(false);
      }
    };
    ws.onclose = () => console.log("WebSocket Disconnected");

    setSocket(ws);

    return () => ws.close();
  }, [url]);

  const sendMessage = (message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      setMessages((prev) => [...prev, { text: message, sender: "user" }]);
      console.log("Sending message to backend", message);
      setIsThinking(true);
      socket.send(message);
    }
  };

  return { messages, sendMessage, isThinking };
};

export default useWebSocket;
