// src/index.ts
import express from "express";
import { sendMessageToClient } from "./services/sendMessageToClient";

const app = express();
app.use(express.json()); // Add this line to parse JSON request bodies
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, TypeScript with Express!");
});

app.post("/api/message", function (req, res) {
  console.log("Request received");
  sendMessageToClient(req, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
