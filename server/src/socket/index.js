import { Server } from 'socket.io';
import { createSocketAuthMiddleware } from './socketAuth.js';
import { registerMessagingHandlers } from './handlers/messaging.js';
import { registerCallHandlers } from './handlers/calls.js';
import { registerMessageActionHandlers } from './handlers/messageActions.js';
import { handleUserConnect, handleUserDisconnect } from './handlers/presence.js';

/**
 * Initializes Socket.io on the HTTP server, applies auth middleware,
 * and registers all socket event handlers.
 */
export const initializeSocket = (server, app) => {
  const socketAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5175'];
  if (process.env.CLIENT_URL) {
    const clientUrls = process.env.CLIENT_URL.split(',').map(url => url.trim());
    socketAllowedOrigins.push(...clientUrls);
  }

  const io = new Server(server, {
    cors: {
      origin: socketAllowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Expose io to routes/controllers
  app.set('io', io);

  // Apply auth middleware
  io.use(createSocketAuthMiddleware());

  // Handle new connections
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected to sockets: ${socket.user.username} (${userId})`);
    
    // Join personal room
    socket.join(userId);

    // Set online presence
    await handleUserConnect(io, socket, userId);

    // Handle typing events
    socket.on('typing', ({ conversationId, recipientId, isTyping }) => {
      socket.to(recipientId).emit('typing', { conversationId, senderId: userId, isTyping });
    });

    // Register all handler groups
    registerMessagingHandlers(socket, io, userId);
    registerCallHandlers(socket, io, userId);
    registerMessageActionHandlers(socket, io, userId);

    // Handle disconnect
    socket.on('disconnect', async () => {
      await handleUserDisconnect(io, socket, userId);
    });
  });

  return io;
};
