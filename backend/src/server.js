import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { checkDatabaseConnection } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO Connection Listener placeholder
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Export io for real-time modules in later phases
export { io };

server.listen(PORT, async () => {
  console.log(`=================================`);
  console.log(`🌾 FarmDex API Server Running`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`DB Health Check: http://localhost:${PORT}/api/health/db`);
  console.log(`=================================`);

  // Independent database connection check on server startup
  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.connected) {
    console.log(`✅ [Database] PostgreSQL connected successfully via Prisma.`);
  } else {
    console.warn(`⚠️ [Database] Connection check failed on startup: ${dbStatus.message}`);
  }
});
