const roomHosts = {};
const hostReadyStatus = {};

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on("join-room", (roomId) => {
      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
      const numClients = clientsInRoom ? clientsInRoom.size : 0;

      console.log(`📊 Room ${roomId} has ${numClients} clients before join`);

      if (numClients === 0) {
        // --- THIS IS THE HOST ---
        socket.join(roomId);
        roomHosts[roomId] = socket.id;
        hostReadyStatus[roomId] = false;

        console.log(`👑 ${socket.id} is HOST for room ${roomId}`);
        socket.emit("you-are-host");
      } else {
        // --- THIS IS A STUDENT ---
        socket.join(roomId);
        console.log(`🎓 ${socket.id} joined room ${roomId} as STUDENT`);

        const hostSocketId = roomHosts[roomId];
        const isHostReady = hostReadyStatus[roomId];

        console.log(`Host: ${hostSocketId}, Ready: ${isHostReady}`);

        if (hostSocketId && isHostReady) {
          console.log(
            `✅ Host ready - notifying host about student ${socket.id}`
          );
          io.to(hostSocketId).emit("user-joined", socket.id);
        } else {
          console.log(`⏳ Host not ready - student ${socket.id} will wait`);
        }
      }
    });

    socket.on("host-ready", (roomId) => {
      console.log(`🎥 Host ${socket.id} is READY in room ${roomId}`);
      hostReadyStatus[roomId] = true;

      // Notify host about all waiting students
      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
      if (clientsInRoom) {
        const students = Array.from(clientsInRoom).filter(
          (id) => id !== socket.id
        );
        console.log(`Found ${students.length} waiting students:`, students);

        students.forEach((studentId) => {
          console.log(`📢 Notifying host about student: ${studentId}`);
          socket.emit("user-joined", studentId);
        });
      }
    });

    socket.on("offer", (offer, studentId) => {
      console.log(`📤 Forwarding OFFER from ${socket.id} to ${studentId}`);
      io.to(studentId).emit("offer", offer, socket.id);
    });

    socket.on("answer", (answer, hostSocketId) => {
      console.log(`📤 Forwarding ANSWER from ${socket.id} to ${hostSocketId}`);
      io.to(hostSocketId).emit("answer", answer, socket.id);
    });

    socket.on("ice-candidate", (candidate, targetSocketId) => {
      console.log(`🧊 Forwarding ICE from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit("ice-candidate", candidate, socket.id);
    });

    socket.on("disconnect", () => {
      console.log(`👋 User disconnected: ${socket.id}`);

      Object.keys(roomHosts).forEach((roomId) => {
        if (roomHosts[roomId] === socket.id) {
          console.log(`💥 Host disconnected from room ${roomId}`);
          delete roomHosts[roomId];
          delete hostReadyStatus[roomId];

          // Notify all students in the room
          io.to(roomId).emit("host-disconnected");
        }
      });
    });
  });
};

module.exports = initializeSocket;
