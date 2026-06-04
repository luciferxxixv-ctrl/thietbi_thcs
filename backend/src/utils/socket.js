const socketIo = require('socket.io');

let io;
// Lưu trữ user connected. Key: userId (hoặc maGV), Value: mảng socketId (do 1 user có thể mở nhiều tab)
const userSockets = new Map();

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // Cấu hình tuỳ theo frontend URL, dùng * cho dev
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Khi client gửi event register cùng userId và role
    socket.on('register', (data) => {
      const { userId, role } = data;
      if (!userId) return;

      socket.userId = userId;
      socket.role = role; // 'admin' hoặc 'teacher'

      if (!userSockets.has(userId)) {
        userSockets.set(userId, []);
      }
      userSockets.get(userId).push(socket.id);

      console.log(`👤 User registered: ${userId} (${role}) with socket: ${socket.id}`);
      
      // Admin tham gia vào room chung 'admins' để dễ broadcast
      if (role === 'admin') {
        socket.join('admins');
        console.log(`👑 Socket ${socket.id} joined room admins`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      if (socket.userId && userSockets.has(socket.userId)) {
        const sockets = userSockets.get(socket.userId);
        const index = sockets.indexOf(socket.id);
        if (index !== -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
};

// Gửi event tới một user cụ thể
const emitToUser = (userId, eventName, data) => {
  if (userSockets.has(userId)) {
    const sockets = userSockets.get(userId);
    sockets.forEach(socketId => {
      io.to(socketId).emit(eventName, data);
    });
  }
};

// Gửi event tới tất cả admin
const emitToAdmins = (eventName, data) => {
  if (io) {
    io.to('admins').emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  getIo,
  emitToUser,
  emitToAdmins
};
