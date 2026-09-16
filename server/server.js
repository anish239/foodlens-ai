import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';
import app from './app.js';
import connectDB, { closeDB } from './config/db.js';
import { validateEnvironment } from './config/envValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables before startup
const envCheck = validateEnvironment();
if (!envCheck.isValid) {
  console.error('❌ Environment validation failed with fatal errors:');
  envCheck.errors.forEach((err) => console.error(`   - ${err}`));
  process.exit(1);
}

if (envCheck.warnings.length > 0) {
  console.warn('⚠️ Environment warnings:');
  envCheck.warnings.forEach((warn) => console.warn(`   - ${warn}`));
}

const PORT = 3000;

// Process-level unhandled rejection / exception listeners
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err.message);
  process.exit(1);
});

async function startServer() {
  try {
    await connectDB();

    const httpServer = http.createServer(app);

    // Vite middleware setup for development
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: {
            server: httpServer,
          },
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(__dirname, '../dist');
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 FoodLens AI Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    process.on('unhandledRejection', (err) => {
      console.error('💥 UNHANDLED REJECTION! Closing server gracefully...', err?.message || err);
      httpServer.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown handling
    const handleShutdown = async (signal) => {
      console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
      httpServer.close(async () => {
        console.log('🛑 HTTP server closed.');
        try {
          await closeDB();
          console.log('🛑 MongoDB connection closed cleanly.');
        } catch (dbErr) {
          console.error('Error closing MongoDB connection:', dbErr);
        }
        process.exit(0);
      });

      setTimeout(() => {
        console.error('⚠️ Forceful shutdown triggered after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Failed to start server / connect to database. Aborted.', err.message);
    process.exit(1);
  }
}

startServer();
