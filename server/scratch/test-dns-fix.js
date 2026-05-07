const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Set DNS servers to Google's
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🦕 Testing MongoDB connection with Google DNS (8.8.8.8)...');

dns.resolveSrv('_mongodb._tcp.cluster404.nfmlz6o.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('❌ DNS SRV lookup still failed:', err.message);
        process.exit(1);
    } else {
        console.log('✅ DNS SRV lookup successful with Google DNS!');
        addresses.forEach(addr => {
            console.log(`   - ${addr.name}:${addr.port}`);
        });
        
        mongoose.connect(MONGODB_URI)
            .then(() => {
                console.log('✅ Successfully connected to MongoDB!');
                process.exit(0);
            })
            .catch(err => {
                console.error('❌ Connection failed after lookup:', err.message);
                process.exit(1);
            });
    }
});
