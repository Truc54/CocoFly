import http from 'http';
import { env } from './config/env';
import prisma from './config/prisma';
import redis from './config/redis';
import app from './app';
import { startAuctionWorker, stopAuctionWorker } from './workers/auction.worker';
import { startPaymentWorker, stopPaymentWorker } from './workers/payment.worker';
import { initSocket } from './config/socket';

const server = http.createServer(app);

async function start() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    // Redis connection is handled automatically by ioredis
    // Verify with a ping
    await redis.ping();

    // Initialize Socket.IO for realtime bidding
    initSocket(server);

    // Start BullMQ workers
    await startAuctionWorker();
    await startPaymentWorker();

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
  await stopPaymentWorker();
  await prisma.$disconnect();
  redis.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

start();
