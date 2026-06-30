import jwt from 'jsonwebtoken';
import { findUserById } from '../services/db.service.js';

/**
 * Creates a Socket.io authentication middleware.
 * Verifies JWT tokens from the handshake and attaches the user to the socket.
 */
export const createSocketAuthMiddleware = () => {
  return async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '123456789');
      const user = await findUserById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  };
};
