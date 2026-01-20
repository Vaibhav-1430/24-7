const { connectDB } = require('./utils/db');
const { verifyToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const Cart = require('./models/Cart');
const MenuItem = require('./models/MenuItem');

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            }
        };
    }

    try {
        await connectDB();

        // Verify token for all cart operations
        const authResult = verifyToken(event);
        if (authResult.error) {
            return errorResponse(authResult.error, authResult.status);
        }

        const userId = authResult.userId;

        // Parse the path to determine the action
        const pathParts = event.path.split('/').filter(part => part);
        const action = pathParts[pathParts.length - 1];

        switch (event.httpMethod) {
            case 'GET':
                return await getCart(userId);
            case 'POST':
                if (action === 'add' || pathParts.length === 2) { // /cart or /cart/add
                    return await addToCart(userId, JSON.parse(event.body || '{}'));
                }
                return errorResponse('Invalid POST action', 400);
            case 'PUT':
                if (action.startsWith('update') || pathParts.includes('update')) {
                    const itemId = pathParts[pathParts.length - 1];
                    return await updateCartItem(userId, itemId, JSON.parse(event.body || '{}'));
                }
                return errorResponse('Invalid PUT action', 400);
            case 'DELETE':
                if (action === 'clear') {
                    return await clearCart(userId);
                } else if (action.startsWith('remove') || pathParts.includes('remove')) {
                    const itemId = pathParts[pathParts.length - 1];
                    return await removeFromCart(userId, itemId);
                } else {
                    // Assume the last part is the item ID to remove
                    return await removeFromCart(userId, action);
                }
            default:
                return errorResponse('Method not allowed', 405);
        }

    } catch (error) {
        console.error('Cart operation error:', error);
        return errorResponse('Server error', 500, error.message);
    }
};

async function getCart(userId) {
    try {
        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: []
            });
            await cart.save();
        }

        return successResponse(cart);
    } catch (error) {
        return errorResponse('Error fetching cart', 500, error.message);
    }
}

async function addToCart(userId, itemData) {
    try {
        const { menuItemId, name, price, quantity, instructions } = itemData;

        // Validation
        if (!menuItemId || !name || !price || !quantity) {
            return errorResponse('Please provide all required fields: menuItemId, name, price, quantity', 400);
        }

        if (quantity < 1 || quantity > 10) {
            return errorResponse('Quantity must be between 1 and 10', 400);
        }

        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: []
            });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.menuItem.toString() === menuItemId && 
            item.instructions === (instructions || '')
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
            if (cart.items[existingItemIndex].quantity > 10) {
                cart.items[existingItemIndex].quantity = 10;
            }
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

        return successResponse(cart, 'Item added to cart');
    } catch (error) {
        console.error('Add to cart error:', error);
        return errorResponse('Error adding to cart', 500, error.message);
    }
}

async function updateCartItem(userId, itemId, updateData) {
    try {
        const { quantity } = updateData;

        if (!quantity || quantity < 1 || quantity > 10) {
            return errorResponse('Invalid quantity. Must be between 1 and 10', 400);
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return errorResponse('Cart not found', 404);
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return errorResponse('Item not found in cart', 404);
        }

        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        return successResponse(cart, 'Cart updated');
    } catch (error) {
        console.error('Update cart error:', error);
        return errorResponse('Error updating cart', 500, error.message);
    }
}

async function removeFromCart(userId, itemId) {
    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return errorResponse('Cart not found', 404);
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return errorResponse('Item not found in cart', 404);
        }

        // Remove item
        cart.items.splice(itemIndex, 1);
        await cart.save();

        return successResponse(cart, 'Item removed from cart');
    } catch (error) {
        console.error('Remove from cart error:', error);
        return errorResponse('Error removing from cart', 500, error.message);
    }
}

async function clearCart(userId) {
    try {
        let cart = await Cart.findOne({ user: userId });
        
        if (cart) {
            cart.items = [];
            await cart.save();
        } else {
            cart = new Cart({
                user: userId,
                items: []
            });
            await cart.save();
        }

        return successResponse(cart, 'Cart cleared');
    } catch (error) {
        console.error('Clear cart error:', error);
        return errorResponse('Error clearing cart', 500, error.message);
    }
}