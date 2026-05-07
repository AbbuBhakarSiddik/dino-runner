const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🦕 Testing MongoDB connection...');
console.log('URI:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));

// Test DNS first
const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.cluster404.nfmlz6o.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('❌ DNS SRV lookup failed:', err.message);
        console.log('\n💡 Possible solutions:');
        console.log('1. Change DNS to Google (8.8.8.8) or Cloudflare (1.1.1.1)');
        console.log('2. Check if your ISP blocks SRV records');
        console.log('3. Try using a VPN');
        console.log('4. Get the direct connection string from MongoDB Atlas');
    } else {
        console.log('✅ DNS SRV lookup successful:');
        addresses.forEach(addr => {
            console.log(`   - ${addr.name}:${addr.port} (priority: ${addr.priority})`);
        });
    }

    // Try connecting anyway
    mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
    })
        .then(() => {
            console.log('✅ Connected to MongoDB!');
            console.log('Connection state:', mongoose.connection.readyState);
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Connection failed:', err.message);
            console.log('\n🔧 To get direct connection string:');
            console.log('1. Go to MongoDB Atlas → Clusters');
            console.log('2. Click "Connect" → "Drivers"');
            console.log('3. Select "Node.js" and version "5.5 or later"');
            console.log('4. Copy the connection string');
            console.log('5. Replace <password> with your actual password');
            process.exit(1);
        });
});