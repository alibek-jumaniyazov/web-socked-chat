const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
  },
});

// Fake users for demonstration purposes
const users = [
  { id: 1, username: "Alice", contacts: [2, 3] }, // Alice's contacts: Bob (2), Charlie (3)
  { id: 2, username: "Bob", contacts: [1, 3] },   // Bob's contacts: Alice (1), Charlie (3)
  { id: 3, username: "Charlie", contacts: [1, 2] }, // Charlie's contacts: Alice (1), Bob (2)
];

// Fake group for demonstration purposes
const group = { id: "group1", members: [1, 2, 3] }; // Group includes Alice, Bob, and Charlie

// Store messages (for simplicity, we'll store them in memory)
let messages = {};
let groupMessages = []; // Store group messages

// API to simulate login
app.post("/login", (req, res) => {
  const { username } = req.body;
  const user = users.find((u) => u.username === username);

  if (user) {
    res.json({ message: "Login successful", userId: user.id });
  } else {
    res.status(400).json({ message: "User not found" });
  }
});

// Get a user's contacts
app.get("/contacts/:userId", (req, res) => {
  const { userId } = req.params;
  const user = users.find((u) => u.id == userId);
  
  if (user) {
    const contactList = user.contacts.map((contactId) => {
      return users.find((u) => u.id === contactId);
    });
    res.json(contactList);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// API to get messages between two users
app.get("/messages/:userId1/:userId2", (req, res) => {
  const { userId1, userId2 } = req.params;
  const chatKey = [userId1, userId2].sort().join("-");
  res.json(messages[chatKey] || []);
});

// API to get group messages
app.get("/group/messages", (req, res) => {
  res.json(groupMessages);
});

// API to send a message between two users
app.post("/send_message", (req, res) => {
  const { senderId, receiverId, message } = req.body;
  const chatKey = [senderId, receiverId].sort().join("-");

  if (!messages[chatKey]) {
    messages[chatKey] = [];
  }

  messages[chatKey].push({ senderId, message });
  res.json({ message: "Message sent" });
});

// API to send a message to the group
app.post("/send_group_message", (req, res) => {
  const { senderId, message } = req.body;

  groupMessages.push({ senderId, message });
  res.json({ message: "Group message sent" });
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("login", (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      socket.username = user.username;
      console.log(`${socket.username} logged in`);
      // Join the group on login
      socket.join(group.id);
    }
  });

  socket.on("send_message", (data) => {
    socket.to(data.receiverId).emit("receive_message", {
      senderId: data.senderId,
      message: data.message,
    });
  });

  // Group messaging
  socket.on("send_group_message", (data) => {
    io.to(group.id).emit("receive_group_message", {
      senderId: data.senderId,
      message: data.message,
    });
  });

  socket.on("disconnect", () => {
    console.log(`${socket.username} Disconnected`, socket.id);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
