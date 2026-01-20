const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    halfPrice: {
        type: Number,
        min: 0
    },
    hasHalf: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        required: true,
        enum: [
            'noodles',
            'veg-manchurian-gravy',
            'rolls',
            'momos',
            'rice',
            'extra',
            'omlet-maggi',
            'parathas',
            'drinks-snacks'
        ]
    },
    image: {
        type: String,
        default: 'images/placeholder.jpg'
    },
    available: {
        type: Boolean,
        default: true
    },
    popular: {
        type: Boolean,
        default: false
    },
    onMRP: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
menuItemSchema.index({ category: 1, available: 1 });
menuItemSchema.index({ popular: 1, available: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);