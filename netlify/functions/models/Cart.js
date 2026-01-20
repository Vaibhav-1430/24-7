const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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
        min: [1, 'Quantity must be at least 1'],
        max: [10, 'Quantity cannot exceed 10']
    },
    instructions: {
        type: String,
        trim: true,
        default: '',
        maxlength: [200, 'Instructions cannot exceed 200 characters']
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema]
}, {
    timestamps: true
});

// Calculate total
cartSchema.virtual('total').get(function() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Calculate item count
cartSchema.virtual('itemCount').get(function() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Ensure virtual fields are serialized
cartSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

// Index for faster queries
cartSchema.index({ user: 1 });

// Export model, handling potential re-compilation in serverless environment
module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);