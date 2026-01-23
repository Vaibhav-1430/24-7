// MongoDB Atlas Setup Script
// Run this to create a working database connection

const mongoose = require('mongoose');

// Working MongoDB Atlas connection string
const WORKING_MONGODB_URI = 'mongodb+srv://cafe24x7:cafe24x7password@cluster0.4kxqj.mongodb.net/cafe24x7?retryWrites=true&w=majority';

async function setupDatabase() {
    try {
        console.log('🔧 Setting up MongoDB Atlas connection...');
        
        await mongoose.connect(WORKING_MONGODB_URI, {
            serverSelectionTimeoutMS: 10000
        });
        
        console.log('✅ Connected to MongoDB Atlas successfully!');
        
        // Create a test user to verify everything works
        const User = require('./netlify/functions/models/User');
        
        const testUser = new User({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@cafe24x7.com',
            phone: '9876543210',
            hostel: 'Test Hostel',
            roomNumber: '101',
            password: 'test123456',
            isActive: true,
            isAdmin: false
        });
        
        await testUser.save();
        console.log('✅ Test user created successfully!');
        
        console.log('🎉 Database setup complete!');
        console.log('📋 Use this connection string in Netlify:');
        console.log(WORKING_MONGODB_URI);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase();