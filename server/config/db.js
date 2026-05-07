const mongoose = require('mongoose');

const connectDB = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🦕 MongoDB connection attempt ${i + 1}/${retries}...`);

            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000, // 10 seconds
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
                retryWrites: true,
                w: 'majority'
            });

            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            console.log(`📊 Database: ${conn.connection.name}`);
            return conn;

        } catch (error) {
            console.error(`❌ MongoDB attempt ${i + 1} failed: ${error.message}`);

            if (i === retries - 1) {
                console.error('🦕 All connection attempts failed. Running without database.');
                console.log('💡 Tips to fix:');
                console.log('  1. Check your IP is whitelisted in MongoDB Atlas');
                console.log('  2. Verify your username and password');
                console.log('  3. Check your network/firewall settings');
                console.log('  4. Try using a VPN if in a restricted network');
                return null;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
};

const checkConnection = () => {
    return mongoose.connection.readyState === 1;
};

// Connection events
mongoose.connection.on('connected', () => {
    console.log('🟢 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 MongoDB disconnected - will attempt to reconnect');
});

// Auto-reconnect
mongoose.connection.on('disconnected', () => {
    setTimeout(() => {
        if (mongoose.connection.readyState !== 1) {
            console.log('🔄 Attempting to reconnect to MongoDB...');
            mongoose.connect(process.env.MONGODB_URI).catch(() => { });
        }
    }, 5000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = { connectDB, checkConnection };