import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    'https://gkwkorqpktidgxladvzi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2tvcnFwa3RpZGd4bGFkdnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzNzAsImV4cCI6MjA4OTU5MjM3MH0.hBT4v2wUyn2KRme6dutz4cK0pApZyF9fonRb0DPyQxM'
);

const tableName = 'hd-store';
const bucketName = 'hd-store';
const cartItems = document.querySelector('#cartItems');
const cartSubtotal = document.querySelector('#cartSubtotal');
const cartTotal = document.querySelector('#cartTotal');

function readCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem('cart'));
        return Array.isArray(savedCart) ? savedCart : [];
    } catch {
        return [];
    }
}

function normalizeQuantity(quantity) {
    const value = Number.parseInt(quantity, 10);
    return Number.isFinite(value) && value > 0 ? value : 1;
}

function numberPrice(price) {
    const value = Number(price);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

function formatPrice(price) {
    return `${numberPrice(price).toFixed(2)} DH`;
}

function getImageUrl(product) {
    const image = product.img || product.image || (Array.isArray(product.images) ? product.images[0] : '');
    if (!image || typeof image !== 'string') return '';
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) return image;
    return supabase.storage.from(bucketName).getPublicUrl(image).data.publicUrl;
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateQuantity(index, change) {
    const cart = readCart();
    const item = cart[index];
    if (!item) return;

    const nextQuantity = normalizeQuantity(item.quantity) + change;
    if (nextQuantity < 1) {
        cart.splice(index, 1);
    } else {
        item.quantity = nextQuantity;
    }

    saveCart(cart);
    loadCart();
}

function mergeCartItems(items) {
    const merged = new Map();

    items.forEach((item) => {
        const key = item.id ? `id-${item.id}` : `name-${item.name || 'unknown'}`;
        const existing = merged.get(key);
        const quantity = normalizeQuantity(item.quantity);
        merged.set(key, existing ? { ...existing, quantity: existing.quantity + quantity } : { ...item, quantity });
    });

    return [...merged.values()];
}

function createCartItem(item, index) {
    const element = document.createElement('article');
    element.className = 'cart-item';

    const image = document.createElement('img');
    image.src = getImageUrl(item);
    image.alt = item.name || 'Product image';
    image.addEventListener('error', () => image.classList.add('image-missing'));

    const info = document.createElement('div');
    info.className = 'cart-item-info';
    const name = document.createElement('h3');
    name.textContent = item.name || 'منتج';
    const quantityControls = document.createElement('div');
    quantityControls.className = 'quantity-controls';
    const decreaseButton = document.createElement('button');
    decreaseButton.type = 'button';
    decreaseButton.textContent = '−';
    decreaseButton.setAttribute('aria-label', 'Decrease quantity');
    decreaseButton.addEventListener('click', () => updateQuantity(index, -1));
    const quantity = document.createElement('span');
    quantity.textContent = normalizeQuantity(item.quantity);
    const increaseButton = document.createElement('button');
    increaseButton.type = 'button';
    increaseButton.textContent = '+';
    increaseButton.setAttribute('aria-label', 'Increase quantity');
    increaseButton.addEventListener('click', () => updateQuantity(index, 1));
    quantityControls.append(decreaseButton, quantity, increaseButton);
    const unitPrice = document.createElement('p');
    unitPrice.className = 'cart-unit-price';
    unitPrice.textContent = `سعر القطعة: ${formatPrice(item.price)} `;
    unitPrice.dir = "rtl"
    const price = document.createElement('p');
    price.className = 'cart-item-price';
    price.textContent = formatPrice(numberPrice(item.price) * normalizeQuantity(item.quantity));
    info.append(name, unitPrice, quantityControls, price);

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-item';
    removeButton.type = 'button';
    removeButton.textContent = 'إزالة';
    removeButton.addEventListener('click', () => {
        const cart = readCart();
        cart.splice(index, 1);
        saveCart(cart);
        loadCart();
    });

    element.append(image, info, removeButton);
    return element;
}

function renderCart(cart) {
    cartItems.replaceChildren();
    const total = cart.reduce((sum, item) => sum + (numberPrice(item.price) * normalizeQuantity(item.quantity)), 0);

    if (!cart.length) {
        const message = document.createElement('p');
        message.className = 'empty-cart';
        message.textContent = 'سلتك فارغة حالياً.';
        cartItems.append(message);
    } else {
        cart.forEach((item, index) => cartItems.append(createCartItem(item, index)));
    }

    cartSubtotal.textContent = formatPrice(total);
    cartTotal.textContent = formatPrice(total);
}

function sendWhatsAppOrder() {
    const cart = mergeCartItems(readCart());
    if (!cart.length) {
        window.alert('سلتك فارغة حالياً.');
        return;
    }

    const lines = cart.map((item) => `- ${item.name || 'منتج'} ×  ${normalizeQuantity(item.quantity)}= ${formatPrice(numberPrice(item.price) * normalizeQuantity(item.quantity))}`);
    const total = cart.reduce((sum, item) => sum + (numberPrice(item.price) * normalizeQuantity(item.quantity)), 0);
    const message = ['مرحباً، أريد طلب المنتجات التالية:', '', ...lines, '', `المجموع: ${formatPrice(total)}`].join('\n');
    window.open(`https://wa.me/212696526127?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

async function loadCart() {
    const cart = mergeCartItems(readCart());
    const productIds = cart.map((item) => item.id).filter((id) => id !== undefined && id !== null);
    let productsById = new Map();

    if (productIds.length) {
        const { data, error } = await supabase
            .from(tableName)
            .select('id, name, img, images, price, description, category')
            .in('id', productIds);

        if (error) {
            console.error('Could not refresh cart product details:', error);
        } else {
            productsById = new Map(data.map((product) => [String(product.id), product]));
        }
    }

    const refreshedCart = cart.map((item) => {
        const product = productsById.get(String(item.id));
        return product
            ? { ...item, ...product, quantity: normalizeQuantity(item.quantity) }
            : { ...item, quantity: normalizeQuantity(item.quantity), price: numberPrice(item.price) };
    });

    saveCart(refreshedCart);
    renderCart(refreshedCart);
}

const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
menuBtn?.addEventListener('click', () => navLinks?.classList.toggle('active'));
document.querySelector('#whatsappOrder')?.addEventListener('click', sendWhatsAppOrder);

loadCart();
