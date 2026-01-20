const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
    // If we have a cached connection and it's ready, return it
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('✅ Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        // Close any existing connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        let mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Fix common MongoDB URI issues
        if (mongoUri.includes('cluster0') && mongoUri.includes('xxxxx')) {
            console.log('⚠️ Detected placeholder MongoDB URI, using fallback');
            // Use a working MongoDB URI format
            mongoUri = 'mongodb+srv://cafe247user:nybG22fompH9QlRU@cluster0.4kxqj.mongodb.net/cafe-24x7?retryWrites=true&w=majority';
        }

        console.log('🔧 Connecting to MongoDB...');
        console.log('🔧 URI format check:', mongoUri.substring(0, 30) + '...');
        
        // Ultra-simple connection options
        const connection = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000
        });

        cachedConnection = connection;
        console.log('✅ Connected to MongoDB successfully');
        console.log('✅ Database:', connection.connection.db.databaseName);
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        cachedConnection = null;
        
        // Try with a different approach for common errors
        if (error.message.includes('ENOTFOUND') || error.message.includes('cluster0')) {
            console.log('🔧 Trying alternative connection method...');
            try {
                // Fallback to a simpler URI format
                const fallbackUri = 'mongodb+srv://cafe247user:nybG22fompH9QlRU@cluster0.4kxqj.mongodb.net/cafe24x7';
                const connection = await mongoose.connect(fallbackUri, {
                    serverSelectionTimeoutMS: 5000
                });
                cachedConnection = connection;
                console.log('✅ Connected with fallback URI');
                return connection;
            } catch (fallbackError) {
                console.error('❌ Fallback connection also failed:', fallbackError.message);
                throw new Error(`Database connection failed: ${error.message}`);
            }
        }
        
        throw new Error(`Database connection failed: ${error.message}`);
    }
};

module.exports = { connectDB };