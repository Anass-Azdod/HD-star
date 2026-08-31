import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    'https://gkwkorqpktidgxladvzi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2tvcnFwa3RpZGd4bGFkdnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzNzAsImV4cCI6MjA4OTU5MjM3MH0.hBT4v2wUyn2KRme6dutz4cK0pApZyF9fonRb0DPyQxM'
);

const tableName = 'hd-store';
const bucketName = 'hd-store';
const mainImage = document.querySelector('#mainProductImage');
const thumbnailList = document.querySelector('#thumbnail-list');
const addCartButton = document.querySelector('#addCartBtn');
const quantityInput = document.querySelector('#quantity');
const message = document.querySelector('#product-message');
let currentProduct;

function productImageUrls(product) {
    const images = [product.img, ...(Array.isArray(product.images) ? product.images : [])]
        .filter((image, index, list) => typeof image === 'string' && image && list.indexOf(image) === index);
    return images.map((image) => (/^(https?:|data:)/.test(image)
        ? image
        : supabase.storage.from(bucketName).getPublicUrl(image).data.publicUrl));
}

function renderGallery(product) {
    const images = productImageUrls(product);
    thumbnailList.replaceChildren();
    mainImage.src = images[0] || '';
    mainImage.alt = product.name || 'منتج';

    images.forEach((source, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = source;
        thumbnail.alt = product.name || 'منتج';
        thumbnail.className = `thumbnail${index === 0 ? ' active' : ''}`;
        thumbnail.addEventListener('click', () => {
            mainImage.src = source;
            thumbnailList.querySelectorAll('.thumbnail').forEach((item) => item.classList.remove('active'));
            thumbnail.classList.add('active');
        });
        thumbnailList.append(thumbnail);
    });
}

function addToCart() {
    const quantity = Math.max(1, Number.parseInt(quantityInput.value, 10) || 1);
    const cart = (() => {
        try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
    })();
    const existingItem = cart.find((item) => String(item.id) === String(currentProduct.id));

    if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 0) + quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: Number(currentProduct.price) || 0,
            img: currentProduct.img,
            images: currentProduct.images,
            quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    message.className = 'product-message';
    message.textContent = 'تمت إضافة المنتج إلى السلة ✓';
}

async function loadProduct() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        message.className = 'product-message error';
        message.textContent = 'لم يتم تحديد منتج لعرضه.';
        document.querySelector('#product-name').textContent = 'المنتج غير متاح';
        return;
    }

    const { data, error } = await supabase
        .from(tableName)
        .select('id, name, img, images, price, description, category')
        .eq('id', id)
        .maybeSingle();

    if (error || !data) {
        console.error('Could not load product:', error);
        message.className = 'product-message error';
        message.textContent = 'تعذر العثور على هذا المنتج.';
        document.querySelector('#product-name').textContent = 'المنتج غير متاح';
        document.querySelector('#product-category').textContent = '';
        return;
    }

    currentProduct = data;
    document.title = `${data.name || 'منتج'} | HD Star`;
    document.querySelector('#product-category').textContent = data.category || 'غير مصنف';
    document.querySelector('#product-name').textContent = data.name || 'منتج بدون اسم';
    document.querySelector('#product-price').textContent = `${(Number(data.price) || 0).toFixed(2)} DH`;
    document.querySelector('#product-description').textContent = data.description || 'لا يتوفر وصف إضافي لهذا المنتج حالياً.';
    renderGallery(data);
    addCartButton.disabled = false;
}

addCartButton.addEventListener('click', addToCart);
document.querySelector('.menu-btn')?.addEventListener('click', () => document.querySelector('.nav-links')?.classList.toggle('active'));
loadProduct();
