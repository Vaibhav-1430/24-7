// Menu Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    let currentCategory = 'all';
    let searchQuery = '';
    let currentItem = null;

    // DOM Elements
    const menuGrid = document.getElementById('menuGrid');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modal = document.getElementById('addToCartModal');
    const closeModal = document.querySelector('.close');

    // Initialize menu
    loadMenuItems();

    // Category Filter Event Listeners
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update current category
            currentCategory = this.dataset.category;
            loadMenuItems();
        });
    });

    // Search Input Event Listener
    searchInput.addEventListener('input', function() {
        searchQuery = this.value.toLowerCase().trim();
        loadMenuItems();
    });

    // Modal Event Listeners
    closeModal.addEventListener('click', closeAddToCartModal);
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAddToCartModal();
        }
    });

    // Quantity Controls
    document.getElementById('decreaseQty').addEventListener('click', function() {
        const qtyInput = document.getElementById('quantity');
        const currentQty = parseInt(qtyInput.value);
        if (currentQty > 1) {
            qtyInput.value = currentQty - 1;
            updateModalTotal();
        }
    });

    document.getElementById('increaseQty').addEventListener('click', function() {
        const qtyInput = document.getElementById('quantity');
        const currentQty = parseInt(qtyInput.value);
        if (currentQty < 10) {
            qtyInput.value = currentQty + 1;
            updateModalTotal();
        }
    });

    document.getElementById('quantity').addEventListener('input', updateModalTotal);

    // Confirm Add to Cart
    document.getElementById('confirmAddToCart').addEventListener('click', function() {
        if (currentItem) {
            const quantity = parseInt(document.getElementById('quantity').value);
            const instructions = document.getElementById('instructions').value.trim();
            
            let price = currentItem.price;
            let sizeName = '';
            
            // Check if half price option is selected
            if (currentItem.hasHalf) {
                const selectedOption = document.querySelector('input[name="priceOption"]:checked');
                if (selectedOption && selectedOption.value === 'half') {
                    price = currentItem.halfPrice;
                    sizeName = ' (Half)';
                } else {
                    sizeName = ' (Full)';
                }
            }
            
            cartManager.addItem({
                id: currentItem.id,
                name: currentItem.name + sizeName,
                price: price,
                quantity: quantity,
                instructions: instructions
            });
            
            closeAddToCartModal();
        }
    });

    // Load and Display Menu Items
    function loadMenuItems() {
        showLoading();
        
        // Simulate API delay
        setTimeout(() => {
            let filteredItems = SAMPLE_MENU_ITEMS;
            
            // Filter by category
            if (currentCategory !== 'all') {
                filteredItems = filteredItems.filter(item => item.category === currentCategory);
            }
            
            // Filter by search query
            if (searchQuery) {
                filteredItems = filteredItems.filter(item => 
                    item.name.toLowerCase().includes(searchQuery) ||
                    item.description.toLowerCase().includes(searchQuery)
                );
            }
            
            displayMenuItems(filteredItems);
        }, 300);
    }

    function displayMenuItems(items) {
        hideLoading();
        
        if (items.length === 0) {
            showNoResults();
            return;
        }
        
        hideNoResults();
        
        menuGrid.innerHTML = items.map(item => `
            <div class="menu-item ${!item.available ? 'unavailable' : ''}" data-id="${item.id}">
                <div class="menu-item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
                    <div class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                        ${item.available ? 'Available' : 'Unavailable'}
                    </div>
                    <div class="category-badge">${getCategoryName(item.category)}</div>
                </div>
                <div class="menu-item-content">
                    <div class="menu-item-name">${item.name}</div>
                    <div class="menu-item-description">${item.description}</div>
                    <div class="menu-item-footer">
                        <div class="menu-item-price">
                            ${item.onMRP ? 'On MRP' : 
                              item.hasHalf ? 
                                `Full: ${APP_CONFIG.currency}${item.price} | Half: ${APP_CONFIG.currency}${item.halfPrice}` : 
                                `${APP_CONFIG.currency}${item.price}`
                            }
                        </div>
                        <button class="add-to-cart-btn" 
                                onclick="openAddToCartModal(${item.id})" 
                                ${!item.available || item.onMRP ? 'disabled' : ''}>
                            ${!item.available ? 'Unavailable' : 
                              item.onMRP ? 'On MRP' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function getCategoryName(category) {
        const categoryNames = {
            'noodles': 'Noodles',
            'veg-manchurian-gravy': 'Veg Manchurian & Gravy',
            'rolls': 'Rolls',
            'momos': 'Momos',
            'rice': 'Rice',
            'extra': 'Extra',
            'omlet-maggi': 'Om Let & Maggi',
            'parathas': 'Parathas (With Pickle & Curds)',
            'drinks-snacks': 'Drinks & Snacks'
        };
        return categoryNames[category] || category;
    }

    function showLoading() {
        loading.style.display = 'block';
        menuGrid.style.display = 'none';
        noResults.style.display = 'none';
    }

    function hideLoading() {
        loading.style.display = 'none';
        menuGrid.style.display = 'grid';
    }

    function showNoResults() {
        noResults.style.display = 'block';
        menuGrid.style.display = 'none';
    }

    function hideNoResults() {
        noResults.style.display = 'none';
    }

    // Modal Functions
    window.openAddToCartModal = function(itemId) {
        const item = SAMPLE_MENU_ITEMS.find(item => item.id === itemId);
        if (!item || !item.available || item.onMRP) return;
        
        currentItem = item;
        
        // Populate modal with item data
        document.getElementById('modalItemImage').src = item.image;
        document.getElementById('modalItemImage').onerror = function() {
            this.src = 'images/placeholder.jpg';
        };
        document.getElementById('modalItemName').textContent = item.name;
        document.getElementById('modalItemDescription').textContent = item.description;
        
        // Handle price display for full/half options
        if (item.hasHalf) {
            document.getElementById('modalItemPrice').innerHTML = `
                <div class="price-options">
                    <label class="price-option">
                        <input type="radio" name="priceOption" value="full" checked>
                        <span>Full - ${APP_CONFIG.currency}${item.price}</span>
                    </label>
                    <label class="price-option">
                        <input type="radio" name="priceOption" value="half">
                        <span>Half - ${APP_CONFIG.currency}${item.halfPrice}</span>
                    </label>
                </div>
            `;
            
            // Add event listeners for price option changes
            document.querySelectorAll('input[name="priceOption"]').forEach(radio => {
                radio.addEventListener('change', updateModalTotal);
            });
        } else {
            document.getElementById('modalItemPrice').textContent = `${APP_CONFIG.currency}${item.price}`;
        }
        
        // Reset form
        document.getElementById('quantity').value = 1;
        document.getElementById('instructions').value = '';
        
        updateModalTotal();
        modal.style.display = 'block';
    };

    function closeAddToCartModal() {
        modal.style.display = 'none';
        currentItem = null;
    }

    function updateModalTotal() {
        if (currentItem) {
            const quantity = parseInt(document.getElementById('quantity').value) || 1;
            let price = currentItem.price;
            
            // Check if half price option is selected
            if (currentItem.hasHalf) {
                const selectedOption = document.querySelector('input[name="priceOption"]:checked');
                if (selectedOption && selectedOption.value === 'half') {
                    price = currentItem.halfPrice;
                }
            }
            
            const total = price * quantity;
            document.getElementById('totalPrice').textContent = total;
        }
    }

    // Keyboard Navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeAddToCartModal();
        }
    });
});