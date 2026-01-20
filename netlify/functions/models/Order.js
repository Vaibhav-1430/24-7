const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Item name is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    instructions: {
        type: String,
        trim: true,
        default: '',
        maxlength: [200, 'Instructions cannot exceed 200 characters']
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
            required: [true, 'Hostel name is required'],
            trim: true
        },
        roomNumber: {
            type: String,
            required: [true, 'Room number is required'],
            trim: true
        },
        instructions: {
            type: String,
            trim: true,
            default: '',
            maxlength: [200, 'Delivery instructions cannot exceed 200 characters']
        }
    },
    contact: {
        name: {
            type: String,
            required: [true, 'Contact name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        }
    },
    payment: {
        method: {
            type: String,
            required: [true, 'Payment method is required'],
            enum: {
                values: ['cod', 'upi'],
                message: 'Payment method must be either cod or upi'
            }
        },
        transactionId: {
            type: String,
            trim: true
        }
    },
    pricing: {
        subtotal: {
            type: Number,
            required: [true, 'Subtotal is required'],
            min: [0, 'Subtotal cannot be negative']
        },
        deliveryFee: {
            type: Number,
            required: [true, 'Delivery fee is required'],
            min: [0, 'Delivery fee cannot be negative']
        },
        tax: {
            type: Number,
            required: [true, 'Tax is required'],
            min: [0, 'Tax cannot be negative']
        },
        total: {
            type: Number,
            required: [true, 'Total is required'],
            min: [0, 'Total cannot be negative']
        }
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ['received', 'preparing', 'ready', 'delivered', 'cancelled'],
            message: 'Invalid order status'
        },
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
            // Get the count of existing orders to generate sequential ID
            const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
            const orderCount = await Order.countDocuments();
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

// Transform output
orderSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

// Export model, handling potential re-compilation in serverless environment
module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);