const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Menu item name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    halfPrice: {
        type: Number,
        min: [0, 'Half price cannot be negative']
    },
    hasHalf: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: [
                'noodles',
                'veg-manchurian-gravy',
                'rolls',
                'momos',
                'rice',
                'extra',
                'omlet-maggi',
                'parathas',
                'drinks-snacks'
            ],
            message: 'Invalid category'
        }
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
menuItemSchema.index({ name: 1 });

// Export model, handling potential re-compilation in serverless environment
module.exports = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);