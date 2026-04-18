import http from 'http';
import { env } from './config/env';
import prisma from './config/prisma';
import redis from './config/redis';
import app from './app';
import { startAuctionWorker, stopAuctionWorker } from './workers/auction.worker';

const server = http.createServer(app);

async function start() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    // Redis connection is handled automatically by ioredis
    // Verify with a ping
    await redis.ping();

    // FUTURE: Initialize Socket.IO here for realtime bidding
    // import { initSocket } from './config/socket';
    // initSocket(server);

    // Start BullMQ worker for auction lifecycle
    startAuctionWorker();

    server.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n🔄 Shutting down gracefully...');
  await stopAuctionWorker();
  await prisma.$disconnect();
  redis.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
