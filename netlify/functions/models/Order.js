const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    instructions: {
        type: String,
        trim: true,
        default: ''
    }
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    delivery: {
        hostel: {
            type: String,
            required: true
        },
        roomNumber: {
            type: String,
            required: true
        },
        instructions: {
            type: String,
            trim: true,
            default: ''
        }
    },
    contact: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    },
    payment: {
        method: {
            type: String,
            required: true,
            enum: ['cod', 'upi']
        },
        transactionId: {
            type: String,
            trim: true
        }
    },
    pricing: {
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        deliveryFee: {
            type: Number,
            required: true,
            min: 0
        },
        tax: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['received', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'received'
    },
    estimatedDelivery: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Generate sequential order ID
orderSchema.pre('save', async function(next) {
    if (!this.orderId) {
        try {
            // Get the count of existing orders
            const orderCount = await mongoose.model('Order').countDocuments();
            const nextOrderNumber = orderCount + 1;
            this.orderId = `001${nextOrderNumber.toString().padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating order ID:', error);
            // Fallback to timestamp-based ID
            const timestamp = Date.now();
            this.orderId = `001${timestamp.toString().slice(-3)}`;
        }
    }
    next();
});

// Index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });

module.exports = mongoose.model('Order', orderSchema);