import { io } from "socket.io-client";

// Connect to the backend server
// Make sure your backend (http://localhost:5000) is running
const SOCKET_URL = "http://localhost:5000";
export const socket = io(SOCKET_URL);
