import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { checkDatabaseConnection } from './config/db.js';

dotenv.config();

import { initSocketServer } from './socket/index.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Initialize Socket.IO with JWT Authentication & Handlers
initSocketServer(io);

// Export io for real-time modules
export { io };

// Validate required JWT environment variable at server startup
if (!process.env.JWT_SECRET) {
  console.error('❌ [Security] Fatal: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

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

  // Cloudinary storage readiness check
  const { isCloudinaryConfigured } = await import('./config/cloudinary.js');
  if (isCloudinaryConfigured()) {
    console.log(`✅ [Cloudinary] Image storage configured and ready.`);
  } else {
    console.log(`ℹ️ [Cloudinary] Image storage not configured.`);
  }
});
