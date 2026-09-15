const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
const clientUrl = process.env.CLIENT_URL;
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, serverless internal)
    if (!origin) return callback(null, true);
    if (
      origin === clientUrl ||
      origin === 'http://localhost:5173' ||
      origin === 'http://127.0.0.1:5173' ||
      /\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for technical evaluation
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API Routes
app.use('/api', apiRoutes);

// Root greeting route
app.get('/', (req, res) => {
  res.json({
    name: 'Mini Storefront API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
