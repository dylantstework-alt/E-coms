let allProducts = [];

// ---------- Cookies ----------

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
    const parts = document.cookie.split('; ');
    for (const part of parts) {
        const pair = part.split('=');
        if (pair[0] === name) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 2018 00:00:00 GMT; path=/`;
}

// ---------- Cache ----------

function showCacheNotice() {
    const entries = performance.getEntriesByType('resource');
    const cached = entries.filter(function (entry) {
        const sameOrigin = entry.name.startsWith(location.origin);
        const isStatic = entry.name.includes('itemImages') || entry.name.endsWith('style.css');
        return sameOrigin && isStatic && entry.transferSize === 0 && entry.decodedBodySize > 0;
    });

    if (cached.length > 0) {
        const notice = document.getElementById('cache-notice');
        notice.textContent = `Using cached images and styles (${cached.length} files) for faster loading.`;
        notice.classList.remove('hidden');
    }
}

// ---------- Catalogue ----------

async function loadProducts() {
    const container = document.getElementById('products');

    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Could not load products');
        }
        allProducts = await response.json();

        const template = document.getElementById('product-template');

        allProducts.forEach(function (product) {
            const card = template.content.cloneNode(true);

            const image = card.querySelector('.product-image');
            image.src = product.image;
            image.alt = product.name;

            card.querySelector('.product-name').textContent = product.name;
            card.querySelector('.product-description').textContent = product.description;
            card.querySelector('.product-price').textContent = `R${product.price.toFixed(2)}`;
            card.querySelector('.add-to-cart').dataset.id = product.id;

            container.appendChild(card);
        });

        renderCart();
    } catch (error) {
        container.textContent = 'Sorry, the catalogue failed to load';
        console.error(error);
    }
}

// ---------- Cart storage ----------

function getCart() {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(productId) {
    const cart = getCart();
    const product = allProducts.find(function (p) {
        return p.id === productId;
    });
    const existing = cart.find(function (item) {
        return item.id === productId;
    });

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: productId, name: product.name, quantity: 1 });
    }

    saveCart(cart);
    renderCart();
}

function removeFromCart(productId) {
    const cart = getCart().filter(function (item) {
        return item.id !== productId;
    });
    saveCart(cart);
    renderCart();
}

function clearCart() {
    localStorage.removeItem('cart');
    renderCart();
}

// ---------- Cart Panel ----------

function renderCart() {
    const cart = getCart();
    const list = document.getElementById('cart-items');
    const rowTemplate = document.getElementById('cart-row-template');
    let total = 0;
    let count = 0;
    list.innerHTML = '';

    cart.forEach(function (item) {
        const product = allProducts.find(function (p) {
            return p.id === item.id;
        });
        if (!product) {
            return;
        }

        const lineTotal = product.price * item.quantity;
        total += lineTotal;
        count += item.quantity;

        const row = rowTemplate.content.cloneNode(true);
        row.querySelector('.cart-row-text').textContent = `${product.name} x ${item.quantity} - R${lineTotal.toFixed(2)}`;
        row.querySelector('.remove').dataset.id = item.id;
        list.appendChild(row);
    });

    if (count === 0) {
        const empty = document.createElement('li');
        empty.className = 'list-group-item';
        empty.textContent = 'Your cart is empty.';
        list.append(empty);
    }

    document.getElementById('cart-total').textContent = `R${total.toFixed(2)}`;
    document.getElementById('cart-count').textContent = count;
}

// ---------- Accounts (practice only, no real security there for didn't find a need for a password input) ----------

function getUsers() {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    return getCookie('currentUser');
}

function showMessage(text) {
    document.getElementById('auth-message').textContent = text;
}

function registerUser(name) {
    const users = getUsers();
    const taken = users.some(function (user) {
        return user.toLowerCase() === name.toLowerCase();
    });

    if (taken) {
        showMessage('That username is already taken.');
        return;
    }

    users.push(name);
    saveUsers(users);
    setCookie('currentUser', name, 30);
    showMessage('');
    updateAccountUI();
}

function loginUser(name) {
    const match = getUsers().find(function (user) {
        return user.toLowerCase() === name.toLowerCase();
    });

    if (!match) {
        showMessage('No account with that username. Try registering.');
        return;
    }

    setCookie('currentUser', match, 30);
    showMessage('');
    updateAccountUI();
}

function logoutUser() {
    deleteCookie('currentUser');
    updateAccountUI();
}

function updateAccountUI() {
    const user = getCurrentUser();
    const loggedIn = Boolean(user);

    document.getElementById('auth-form').classList.toggle('hidden', loggedIn);
    document.getElementById('welcome').classList.toggle('hidden', !loggedIn);
    document.getElementById('members-only').classList.toggle('hidden', loggedIn);

    if (loggedIn) {
        document.getElementById('welcome-text').textContent = `Welcome, ${user}!`;
    }
}

// ---------- Font Preference ----------

function applyFont(font) {
    document.body.style.fontFamily = font;
}

function loadFontPreference() {
    const saved = sessionStorage.getItem('font');
    if (saved) {
        applyFont(saved);
        document.getElementById('font-select').value = saved;
    }
}

// ---------- Event Listeners ----------

document.getElementById('products').addEventListener('click', function (event) {
    if (!event.target.classList.contains('add-to-cart')) {
        return;
    }

    if (!getCurrentUser()) {
        showMessage('Please register or log in to add items to your cart.');
        document.getElementById('userName').focus();
        return;
    }

    addToCart(Number(event.target.dataset.id));
});

document.getElementById('cart-toggle').addEventListener('click', function () {
    document.getElementById('cart-panel').classList.toggle('closed');
});

document.getElementById('cart-items').addEventListener('click', function (event) {
    if (event.target.classList.contains('remove')) {
        removeFromCart(Number(event.target.dataset.id));
    }
});

document.getElementById('clear-cart').addEventListener('click', function () {
    if (confirm('Remove everything from your cart?')) {
        clearCart();
    }
});

document.getElementById('auth-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const action = event.submitter.dataset.action;

    if (!name) {
        return;
    }

    if (action === 'register') {
        registerUser(name);
    } else {
        loginUser(name);
    }
    document.getElementById('userName').value = '';
});

document.getElementById('logout-btn').addEventListener('click', logoutUser);

document.getElementById('font-select').addEventListener('change', function () {
    sessionStorage.setItem('font', this.value);
    applyFont(this.value);
});

document.getElementById('reset-prefs').addEventListener('click', function () {
    if (confirm('Reset your preferences? Note: This will log you out and clears your saved cart and font.')) {
        deleteCookie('currentUser');
        localStorage.removeItem('cart');
        sessionStorage.removeItem('font');
        document.body.style.fontFamily = '';
        document.getElementById('font-select').selectedIndex = 0;
        updateAccountUI();
        renderCart();
    }
});

//  ----------- Start ----------

updateAccountUI();

loadProducts().then(function () {
    setTimeout(showCacheNotice, 1000);
});

loadFontPreference();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}