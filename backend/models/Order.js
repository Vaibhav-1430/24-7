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

// Generate order ID before saving
orderSchema.pre('save', function(next) {
    if (!this.orderId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        this.orderId = `247${timestamp.toString().slice(-6)}${random}`;
    }
    next();
});

// Index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });

module.exports = mongoose.model('Order', orderSchema);