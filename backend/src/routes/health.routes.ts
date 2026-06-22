import { Router } from 'express';
import prisma from '../config/prisma';
import redis from '../config/redis';

const router = Router();

// Basic health check (for Railway health check + UptimeRobot)
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Deep health check — pings DB + Redis to keep Neon awake
router.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisOk = await redis.ping();
    res.json({ status: 'ok', db: 'connected', redis: redisOk });
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message });
  }
});

export { router as healthRoutes };
