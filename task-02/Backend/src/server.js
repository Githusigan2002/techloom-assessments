require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { releaseExpiredReservations } = require('./services/inventoryService');

const PORT = process.env.PORT || 5000;

// Initialize Database connection
connectDB();

// Periodic sweeper: release expired stock reservations every 60 seconds
const reservationSweeper = setInterval(() => {
  releaseExpiredReservations();
}, 60 * 1000);

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Clean up background timer and server on shutdown
const shutdown = () => {
  clearInterval(reservationSweeper);
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection! Shutting down...', err);
  shutdown();
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
