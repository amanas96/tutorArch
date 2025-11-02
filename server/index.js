const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./src/config/db");
const sessionRoutes = require("./src/routes/sessionRoutes");
const initializeSocket = require("./src/socket/socketHandler");

// --- Initial Setup ---
const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.io
const PORT = process.env.PORT || 5000;

// --- Database Connection ---
connectDB();

// --- Middlewares ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse JSON bodies

// --- API Routes ---
// Mount the session routes at /api/sessions
app.use("/api/sessions", sessionRoutes);

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (for development)
    methods: ["GET", "POST"],
  },
});

// Initialize socket handling logic
initializeSocket(io);

// --- Start the Server ---
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
