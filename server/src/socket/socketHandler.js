// socketHandler.js
const roomHosts = new Map(); // roomId → hostSocketId
const hostReadyStatus = new Map(); // roomId → boolean
const studentList = new Map(); // roomId → [{ id, name }]

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // === 1️⃣ JOIN ROOM (Host or Student) ===
    socket.on("join-room", ({ roomId, name }) => {
      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
      const numClients = clientsInRoom ? clientsInRoom.size : 0;

      if (numClients === 0) {
        // --- HOST joins ---
        socket.join(roomId);
        roomHosts.set(roomId, socket.id);
        hostReadyStatus.set(roomId, false);
        studentList.set(roomId, []);
        socket.emit("you-are-host");
        console.log(`👑 Host joined room: ${roomId}`);
      } else {
        // --- STUDENT joins ---
        socket.join(roomId);
        const student = { id: socket.id, name: name || "Anonymous" };

        if (!studentList.has(roomId)) studentList.set(roomId, []);
        const students = studentList.get(roomId);
        students.push(student);
        studentList.set(roomId, students);

        const hostSocketId = roomHosts.get(roomId);
        if (hostSocketId) {
          io.to(hostSocketId).emit("user-joined", student);
          io.to(hostSocketId).emit("student-list", students);
          io.to(hostSocketId).emit("student-count", students.length);
        }

        console.log(`🎓 Student (${student.name}) joined ${roomId}`);
      }
    });

    // === 2️⃣ HOST READY ===
    socket.on("host-ready", (roomId) => {
      hostReadyStatus.set(roomId, true);
      console.log(`🎥 Host ready for room ${roomId}`);
    });

    // === 3️⃣ OFFER/ANSWER/ICE EXCHANGE ===
    socket.on("offer", (offer, studentId) => {
      console.log(`📤 Offer from host -> student: ${studentId}`);
      io.to(studentId).emit("offer", offer, socket.id);
    });

    socket.on("answer", (answer, hostSocketId, studentId) => {
      console.log(`📤 Answer from ${studentId} -> host: ${hostSocketId}`);
      io.to(hostSocketId).emit("answer", answer, studentId);
    });

    socket.on("ice-candidate", (candidate, targetId) => {
      if (targetId) io.to(targetId).emit("ice-candidate", candidate, socket.id);
    });

    // === 4️⃣ END SESSION ===
    socket.on("end-session", (roomId) => {
      console.log(`🔴 Host ended session: ${roomId}`);
      io.to(roomId).emit("session-ended");
      roomHosts.delete(roomId);
      hostReadyStatus.delete(roomId);
      studentList.delete(roomId);
      io.socketsLeave(roomId);
    });

    // === 5️⃣ DISCONNECT HANDLER ===
    socket.on("disconnect", () => {
      console.log(`👋 Disconnected: ${socket.id}`);

      // If host left
      for (const [roomId, hostSocketId] of roomHosts.entries()) {
        if (hostSocketId === socket.id) {
          console.log(`💥 Host left room: ${roomId}`);
          io.to(roomId).emit("session-ended");
          roomHosts.delete(roomId);
          hostReadyStatus.delete(roomId);
          studentList.delete(roomId);
          io.socketsLeave(roomId);
          return;
        }
      }

      // If student left
      for (const [roomId, students] of studentList.entries()) {
        const index = students.findIndex((s) => s.id === socket.id);
        if (index !== -1) {
          const [removed] = students.splice(index, 1);
          studentList.set(roomId, students);
          const hostSocketId = roomHosts.get(roomId);
          if (hostSocketId) {
            io.to(hostSocketId).emit("student-left", removed.id);
            io.to(hostSocketId).emit("student-list", students);
            io.to(hostSocketId).emit("student-count", students.length);
          }
          console.log(`🎓 Student left: ${removed.name} from ${roomId}`);
          break;
        }
      }
    });
  });
};

module.exports = initializeSocket;
