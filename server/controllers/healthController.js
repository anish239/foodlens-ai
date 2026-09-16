import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getSanitizedEnvSummary } from '../config/envValidator.js';
import { getDatabaseInfo } from '../config/db.js';

const startTime = Date.now();

export const getApiStatus = asyncHandler(async (req, res) => {
  const dbInfo = getDatabaseInfo();
  res.status(200).json({
    success: true,
    message: 'FoodLens AI API is running',
    data: {
      service: 'FoodLens AI API',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: dbInfo.type,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    },
  });
});

export const getHealthStatus = asyncHandler(async (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStateCode = mongoose.connection.readyState;
  const dbStatus = dbStates[dbStateCode] || 'unknown';
  const isHealthy = dbStateCode === 1;
  const dbInfo = getDatabaseInfo();

  if (!isHealthy) {
    return res.status(503).json({
      success: false,
      message: 'FoodLens AI API database is not connected',
      data: {
        status: 'unhealthy',
        service: 'FoodLens AI API',
        database: dbStatus,
        engine: dbInfo.type,
        atlasIpNotice: dbInfo.atlasIpNotice,
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
      },
    });
  }

  res.status(200).json({
    success: true,
    message: 'FoodLens AI API is healthy',
    data: {
      status: 'healthy',
      service: 'FoodLens AI API',
      database: 'connected',
      engine: dbInfo.type,
      databaseName: dbInfo.database,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    },
  });
});

export const getReadinessStatus = asyncHandler(async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const memoryUsage = process.memoryUsage();
  const envSummary = getSanitizedEnvSummary();
  const dbInfo = getDatabaseInfo();

  const readinessData = {
    service: 'FoodLens AI API',
    ready: isDbConnected,
    database: {
      connected: isDbConnected,
      status: isDbConnected ? 'connected' : 'disconnected',
      engine: dbInfo.type,
      databaseName: dbInfo.database,
    },
    system: {
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      nodeVersion: process.version,
      memoryRssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      memoryHeapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
    },
    configuration: {
      environment: envSummary.nodeEnv,
      geminiConfigured: envSummary.geminiApiKeyConfigured,
      jwtConfigured: envSummary.jwtSecretConfigured,
    },
    timestamp: new Date().toISOString(),
  };

  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: 'Service is not ready: Database connection unavailable',
      data: readinessData,
    });
  }

  res.status(200).json({
    success: true,
    message: 'FoodLens AI API is ready to serve traffic',
    data: readinessData,
  });
});
