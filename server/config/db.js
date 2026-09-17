import mongoose from 'mongoose';
import { syncMemoryUsersToMongo } from '../services/userStore.js';

// Disable Mongoose command buffering so queries fail fast when disconnected instead of hanging
mongoose.set('bufferCommands', false);

let mongodInstance = null;
let currentDbInfo = {
  connected: false,
  type: 'none',
  uri: null,
  database: null,
  atlasIpNotice: false,
};

/**
 * Returns diagnostic metadata regarding active database connection
 */
export const getDatabaseInfo = () => ({
  ...currentDbInfo,
  readyState: mongoose.connection.readyState,
});

/**
 * Sanitizes MongoDB connection string to safely log without leaking credentials.
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '(empty)';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
};

let eventListenersRegistered = false;

const registerActiveConnectionEvents = () => {
  if (eventListenersRegistered) return;
  eventListenersRegistered = true;

  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB Connected successfully to database: "${mongoose.connection.name}"`);
  });

  mongoose.connection.on('error', (err) => {
    // Only log if connection is established and drops unexpectedly
    if (mongoose.connection.readyState === 1) {
      console.warn('⚠️ MongoDB runtime connection warning:', err?.message || err);
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB Disconnected from database cluster.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB Reconnected to cluster.');
  });
};

const connectDB = async () => {
  // 0. Reuse active connection if already connected (e.g. serverless warm container reuse)
  if (mongoose.connection.readyState === 1) {
    currentDbInfo.connected = true;
    return mongoose.connection;
  }
  // If connection is currently in progress, wait for it to settle
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', resolve);
    });
    if (mongoose.connection.readyState === 1) {
      currentDbInfo.connected = true;
      return mongoose.connection;
    }
  }

  const mongoUri = process.env.MONGODB_URI;

  // 1. Try primary URI if specified (e.g. Atlas cluster)
  if (mongoUri) {
    const sanitizedUri = sanitizeMongoUri(mongoUri);
    try {
      const connectOptions = {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        family: 4, // Force IPv4 to prevent IPv6 routing delays on cloud networks
        autoIndex: process.env.NODE_ENV !== 'production',
      };

      const hasDbInUri = /mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/.test(mongoUri);
      if (!hasDbInUri) {
        connectOptions.dbName = 'foodlens';
      }

      const conn = await mongoose.connect(mongoUri, connectOptions);
      currentDbInfo = {
        connected: true,
        type: 'atlas',
        uri: sanitizedUri,
        database: conn.connection.name,
        atlasIpNotice: false,
      };

      registerActiveConnectionEvents();
      console.log(`✅ MongoDB Connection Established: ${conn.connection.host} (Database: "${conn.connection.name}") [${sanitizedUri}]`);
      await syncMemoryUsersToMongo(mongoose);
      return conn;
    } catch (error) {
      // Disconnect cleanly to prevent lingering background SSL handshakes or socket retries
      await mongoose.disconnect().catch(() => {});

      const isWhitelistError = error.message?.includes('whitelist') || error.name === 'MongooseServerSelectionError';
      currentDbInfo.atlasIpNotice = isWhitelistError;

      console.error(`❌ Primary MongoDB cluster (${sanitizedUri}) unreachable: ${error.message}`);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Production database connection failure: Unable to connect to MongoDB Atlas (${sanitizedUri}). In-memory fallback is strictly disabled in production. Details: ${error.message}`);
      }
      if (isWhitelistError) {
        console.log('ℹ️ Tip: To connect FoodLens AI directly to MongoDB Atlas, add 0.0.0.0/0 to your Atlas Network Access IP whitelist (https://www.mongodb.com/docs/atlas/security-whitelist/).');
      }
      console.log('🔄 [Dev/Test] Activating embedded MongoDB engine for development and automated testing...');
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('Production database configuration error: MONGODB_URI is required in production mode.');
  }

  // 2. Fallback to embedded MongoMemoryServer (strictly limited to test and development environments)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production database error: In-memory fallback is strictly prohibited in production mode.');
  }

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    if (!mongodInstance) {
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'foodlens',
        },
      });
    }
    const localUri = mongodInstance.getUri();
    const conn = await mongoose.connect(localUri, {
      dbName: 'foodlens',
      autoIndex: true,
    });

    currentDbInfo = {
      connected: true,
      type: 'embedded',
      uri: 'mongodb://127.0.0.1:local/foodlens',
      database: 'foodlens',
      atlasIpNotice: currentDbInfo.atlasIpNotice,
    };

    registerActiveConnectionEvents();
    console.log(`✅ Embedded MongoDB Engine Connected (Database: "foodlens")`);
    await syncMemoryUsersToMongo(mongoose);
    return conn;
  } catch (embeddedErr) {
    console.warn(`⚠️ Could not initialize embedded MongoDB: ${embeddedErr.message}`);
    return null;
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close(false);
  } catch (err) {
    // Ignore close errors during shutdown
  }
  if (mongodInstance) {
    try {
      await mongodInstance.stop();
    } catch (err) {
      // Ignore stop errors during shutdown
    }
  }
};

export default connectDB;

