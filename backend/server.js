require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

// Import Scheduler
const { setupScheduler } = require('./agents/scheduler');

// Import Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const departmentRoutes = require('./routes/departments');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');
const chatRoutes = require('./routes/chat');

// Import Middleware
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// CORS Config
const allowedOrigins = [
  'http://localhost:5173',
  'https://lekh-sahayak.vercel.app'
];
if (process.env.FRONTEND_URL) {
  const cleanUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
  if (!allowedOrigins.includes(cleanUrl)) {
    allowedOrigins.push(cleanUrl);
  }
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT']
  }
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(generalLimiter); // Apply rate limiter to all routes

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lekhsahayak')
.then(() => {
  console.log('Connected to MongoDB');
  
  // Initialize scheduler after DB connection
  setupScheduler();
})
.catch((err) => console.error('MongoDB connection error:', err));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);

// General API Routes (includes complaint submisson, feedback, resolution)
app.use('/api', apiRoutes);

// Global error handler for Multer and other middleware errors
const multer = require('multer');
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 5 files allowed.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err && err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Socket.io Real-time connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Citizen can join a "room" specific to their tracking ID to get private updates
  socket.on('join_tracking_room', (trackingId) => {
    socket.join(trackingId);
    console.log(`Socket ${socket.id} joined tracking room: ${trackingId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
