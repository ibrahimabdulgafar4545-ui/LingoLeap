import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
};

const SOCKET_URL = getSocketUrl();

let socket = null;

export const initiateSocket = (token) => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('🔌 Socket connected successfully:', socket.id);
  });
  
  socket.on('connect_error', (err) => {
    console.error('🔌 Socket connection error:', err.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.warn('🔌 Socket disconnected:', reason);
  });
  
  console.log('🔌 Socket connection initiated.');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected.');
  }
};

export const getSocket = () => socket;
