const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
    // If we have a cached connection and it's ready, return it
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        // Close any existing connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('Connecting to MongoDB Atlas...');
        
        const connection = await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            bufferCommands: false,
            bufferMaxEntries: 0
        });

        cachedConnection = connection;
        console.log('✅ Connected to MongoDB Atlas');
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        cachedConnection = null;
        throw new Error(`Database connection failed: ${error.message}`);
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
    cachedConnection = null;
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
    cachedConnection = null;
});

module.exports = { connectDB };