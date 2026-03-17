import express from 'express';
import { auctionRoutes } from './routes/auction.routes';

const app = express();

app.use(express.json());

// Main API Routes
app.use('/api/auctions', auctionRoutes);

// Global Error Handler placeholder
// app.use(errorHandler);

export default app;
