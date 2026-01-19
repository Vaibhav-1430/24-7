const express = require('express');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

// @route   GET /api/menu
// @desc    Get all menu items
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, available, popular } = req.query;
        
        // Build filter object
        let filter = {};
        
        if (category && category !== 'all') {
            filter.category = category;
        }
        
        if (available !== undefined) {
            filter.available = available === 'true';
        }
        
        if (popular !== undefined) {
            filter.popular = popular === 'true';
        }

        const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });

        res.json({
            success: true,
            count: menuItems.length,
            data: menuItems
        });

    } catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching menu items'
        });
    }
});

// @route   GET /api/menu/:id
// @desc    Get single menu item
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            data: menuItem
        });

    } catch (error) {
        console.error('Get menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching menu item'
        });
    }
});

// @route   GET /api/menu/category/:category
// @desc    Get menu items by category
// @access  Public
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { available } = req.query;
        
        let filter = { category };
        
        if (available !== undefined) {
            filter.available = available === 'true';
        }

        const menuItems = await MenuItem.find(filter).sort({ name: 1 });

        res.json({
            success: true,
            category,
            count: menuItems.length,
            data: menuItems
        });

    } catch (error) {
        console.error('Get menu items by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching menu items'
        });
    }
});

// @route   GET /api/menu/search/:query
// @desc    Search menu items
// @access  Public
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { available } = req.query;
        
        let filter = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        };
        
        if (available !== undefined) {
            filter.available = available === 'true';
        }

        const menuItems = await MenuItem.find(filter).sort({ name: 1 });

        res.json({
            success: true,
            query,
            count: menuItems.length,
            data: menuItems
        });

    } catch (error) {
        console.error('Search menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while searching menu items'
        });
    }
});

module.exports = router;