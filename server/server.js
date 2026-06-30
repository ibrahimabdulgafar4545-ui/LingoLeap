import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { checkDbConnection, isFallbackMode } from './src/services/db.service.js';
import { verifyEmailTransporter } from './src/services/email.service.js';
import { verifyAIConnectionOnStartup } from './src/controllers/ai.controller.new.js';
import { runStartupDiagnostic } from './src/startup/diagnostic.js';
import { auditAndSeedLessons } from './src/startup/seed.js';
import { initializeSocket } from './src/socket/index.js';

// Run startup diagnostics (password checks on local db.json)
runStartupDiagnostic();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Attempt MongoDB connection (falls back to JSON automatically)
  await checkDbConnection();

  // Audit existing lessons, generate curriculum, load data, and seed DB
  await auditAndSeedLessons();

  // Start HTTP server
  const server = app.listen(PORT, async () => {
    console.log(`\n🚀 LingoLeap server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    if (isFallbackMode()) {
      console.log('📦 Using local filesystem database (data/db.json)\n');
    } else {
      console.log('🍃 Using MongoDB Atlas/local database\n');
    }
    // Verify Brevo SMTP connection
    verifyEmailTransporter();

    // Verify AI connection
    await verifyAIConnectionOnStartup();
  });

  // Initialize Socket.io with all handlers
  initializeSocket(server, app);

  // Global error handler
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
