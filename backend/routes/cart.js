const express = require('express');
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.userId }).populate('items.menuItem');
        
        if (!cart) {
            cart = new Cart({ user: req.userId, items: [] });
            await cart.save();
        }

        res.json({
            success: true,
            data: cart
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching cart'
        });
    }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', auth, async (req, res) => {
    try {
        const { menuItemId, name, price, quantity, instructions } = req.body;

        // Validation
        if (!menuItemId || !name || !price || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Verify menu item exists
        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        if (!menuItem.available) {
            return res.status(400).json({
                success: false,
                message: 'Menu item is not available'
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            cart = new Cart({ user: req.userId, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.menuItem.toString() === menuItemId && 
            item.name === name &&
            item.instructions === (instructions || '')
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                menuItem: menuItemId,
                name,
                price,
                quantity,
                instructions: instructions || ''
            });
        }

        await cart.save();

        res.json({
            success: true,
            message: 'Item added to cart',
            data: cart
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding to cart'
        });
    }
});

// @route   PUT /api/cart/update/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/update/:itemId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1 || quantity > 10) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be between 1 and 10'
            });
        }

        const cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        item.quantity = quantity;
        await cart.save();

        res.json({
            success: true,
            message: 'Cart updated',
            data: cart
        });

    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating cart'
        });
    }
});

// @route   DELETE /api/cart/remove/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:itemId', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items.id(req.params.itemId).remove();
        await cart.save();

        res.json({
            success: true,
            message: 'Item removed from cart',
            data: cart
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while removing from cart'
        });
    }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared',
            data: cart
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while clearing cart'
        });
    }
});

module.exports = router;