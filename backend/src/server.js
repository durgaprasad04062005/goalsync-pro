require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const authRoutes         = require('./routes/auth');
const goalRoutes         = require('./routes/goals');
const achievementRoutes  = require('./routes/achievements');
const adminRoutes        = require('./routes/admin');
const reportRoutes       = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const userRoutes         = require('./routes/users');
const { errorHandler }   = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    /\.vercel\.app$/,   // allow all vercel preview URLs
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 500 }));
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 30 });

// ── Logging & parsing ─────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/goals',         goalRoutes);
app.use('/api/achievements',  achievementRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users',         userRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use('*', (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 GoalSync Pro API  →  http://localhost:${PORT}`);
    console.log(`📋 Health check     →  http://localhost:${PORT}/health`);
  });
};

start();
module.exports = app;
