const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
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

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { delivery, contact, payment } = req.body;

        // Validation
        if (!delivery || !contact || !payment) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ user: req.userId }).populate('items.menuItem');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Calculate pricing
        const subtotal = cart.total;
        const deliveryFee = subtotal > 0 ? 10 : 0;
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + deliveryFee + tax;

        // Create order
        const order = new Order({
            user: req.userId,
            items: cart.items.map(item => ({
                menuItem: item.menuItem._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                instructions: item.instructions
            })),
            delivery,
            contact,
            payment,
            pricing: {
                subtotal,
                deliveryFee,
                tax,
                total
            },
            estimatedDelivery: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
        });

        await order.save();

        // Clear user's cart
        cart.items = [];
        await cart.save();

        // Populate the order for response
        await order.populate('user', 'firstName lastName email phone');
        await order.populate('items.menuItem', 'name description category');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating order'
        });
    }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;
        
        let filter = { user: req.userId };
        if (status) {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate('items.menuItem', 'name description category')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(filter);

        res.json({
            success: true,
            count: orders.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: orders
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
});

// @route   GET /api/orders/:orderId
// @desc    Get single order
// @access  Private
router.get('/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ 
            orderId: req.params.orderId, 
            user: req.userId 
        })
        .populate('user', 'firstName lastName email phone')
        .populate('items.menuItem', 'name description category');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching order'
        });
    }
});

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.put('/:orderId/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ 
            orderId: req.params.orderId, 
            user: req.userId 
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'received') {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while cancelling order'
        });
    }
});

// Admin routes (for restaurant staff)

// @route   GET /api/orders/admin/all
// @desc    Get all orders (admin only)
// @access  Private (Admin)
router.get('/admin/all', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { status, limit = 20, page = 1 } = req.query;
        
        let filter = {};
        if (status) {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate('user', 'firstName lastName email phone hostel roomNumber')
            .populate('items.menuItem', 'name description category')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(filter);

        res.json({
            success: true,
            count: orders.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: orders
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
});

// @route   PUT /api/orders/admin/:orderId/status
// @desc    Update order status (admin only)
// @access  Private (Admin)
router.put('/admin/:orderId/status', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { status } = req.body;
        const validStatuses = ['received', 'preparing', 'ready', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;
        await order.save();

        await order.populate('user', 'firstName lastName email phone');
        await order.populate('items.menuItem', 'name description category');

        res.json({
            success: true,
            message: 'Order status updated',
            data: order
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating order status'
        });
    }
});

module.exports = router;