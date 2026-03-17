import http from 'http';
import app from './app';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// FUTURE: Initialize Socket.IO here for realtime bidding
// import { initSocket } from './config/socket';
// initSocket(server);

// FUTURE: Initialize Database and Redis connection
// await prisma.$connect();
// await redis.connect();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
