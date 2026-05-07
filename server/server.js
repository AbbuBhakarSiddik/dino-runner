const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const { Server } = require('socket.io');

// Fix for DNS SRV lookup issues (common in some networks)
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/user');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Create data directory for local storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory for local storage');
}

// Initialize local storage files if they don't exist
const localFiles = ['users.json', 'scores.json', 'leaderboard.json'];
localFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '[]', 'utf8');
    }
});

// Make local storage available to routes
app.locals.dataDir = dataDir;
app.locals.useLocalStorage = true; // Set to false when MongoDB is connected

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: '🦕 Rawr! Dino server is alive!',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'using-local-storage',
        environment: process.env.NODE_ENV || 'development',
        storage: app.locals.useLocalStorage ? 'local-json' : 'mongodb'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// WebSocket connection
io.on('connection', (socket) => {
    console.log('🦕 New player connected:', socket.id);

    socket.on('join-leaderboard', () => {
        socket.join('leaderboard');
        console.log(`📊 ${socket.id} joined leaderboard room`);
    });

    socket.on('new-score', async (scoreData) => {
        try {
            io.to('leaderboard').emit('leaderboard-update', {
                type: 'new-score',
                data: scoreData
            });
        } catch (error) {
            console.error('Error broadcasting score:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('🦖 Player disconnected:', socket.id);
    });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dino-runner';

console.log('🦕 Attempting MongoDB connection...');

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 5000
})
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        app.locals.useLocalStorage = false;
    })
    .catch((err) => {
        console.log('⚠️  MongoDB not available - Using local JSON storage');
        console.log('💡 Local storage location:', dataDir);
        console.log('📝 Data will persist in JSON files');
        app.locals.useLocalStorage = true;
    });

mongoose.connection.on('error', (err) => {
    // Silently handle - we're using local storage
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: '🦴 Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
  🦕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🦕
  🦖        Dino Runner Server Running!        🦖
  🦕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🦕
  
  📡 Server:    http://localhost:${PORT}
  ❤️  Health:    http://localhost:${PORT}/health
  🗄️  Storage:   ${app.locals.useLocalStorage ? '📁 Local JSON' : '🍃 MongoDB'}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  
  Ready to outrun extinction! 🏃‍♂️💨
  `);
});

module.exports = { app, server, io };