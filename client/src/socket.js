import { io } from "socket.io-client";

// Connect to the backend server
// Make sure your backend (http://localhost:5000) is running
const SOCKET_URL = "https://tutorarch.onrender.com/";
export const socket = io(SOCKET_URL);
