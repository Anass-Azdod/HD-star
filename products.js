import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    'https://gkwkorqpktidgxladvzi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2tvcnFwa3RpZGd4bGFkdnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzNzAsImV4cCI6MjA4OTU5MjM3MH0.hBT4v2wUyn2KRme6dutz4cK0pApZyF9fonRb0DPyQxM'
);

const tableName = 'hd-store';
const bucketName = 'hd-store';
const categoryFilters = document.querySelector('#category-filters');
const catalogGrid = document.querySelector('#catalog-grid');
const resultCount = document.querySelector('#products-result-count');
const searchInput = document.querySelector('#product-search');
const sortSelect = document.querySelector('#product-sort');
let allProducts = [];
let activeCategory = '';

function imageUrl(product) {
    const image = product.img || (Array.isArray(product.images) ? product.images[0] : '');
    if (!image || typeof image !== 'string') return '';
    if (/^(https?:|data:)/.test(image)) return image;
    return supabase.storage.from(bucketName).getPublicUrl(image).data.publicUrl;
}

function price(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function updateResultCount(count) {
    resultCount.replaceChildren();
    const total = document.createElement('strong');
    total.textContent = count;
    resultCount.append(total, ` منتج${count === 1 ? '' : 'اً'} متاحاً`);
}

function renderCategories() {
    const counts = allProducts.reduce((map, product) => {
        const category = product.category?.trim() || 'غير مصنف';
        map.set(category, (map.get(category) || 0) + 1);
        return map;
    }, new Map());

    categoryFilters.replaceChildren();
    [['', 'كل المنتجات', allProducts.length], ...counts].forEach(([value, label, count]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `filter-link${value === activeCategory ? ' active' : ''}`;
        const title = document.createElement('span');
        title.textContent = label;
        const total = document.createElement('small');
        total.textContent = count;
        button.append(title, total);
        button.addEventListener('click', () => {
            activeCategory = value;
            renderCategories();
            renderProducts();
        });
        categoryFilters.append(button);
    });
}

function createCard(product) {
    const card = document.createElement('a');
    card.className = 'catalog-card';
    card.href = `product.html?id=${encodeURIComponent(product.id)}`;

    const visual = document.createElement('div');
    visual.className = 'catalog-image';
    const badge = document.createElement('span');
    badge.className = 'stock-badge';
    badge.textContent = 'متوفر';
    const image = document.createElement('img');
    image.src = imageUrl(product);
    image.alt = product.name || 'منتج';
    visual.append(badge, image);

    const info = document.createElement('div');
    info.className = 'catalog-card-info';
    const category = document.createElement('p');
    category.textContent = product.category || 'غير مصنف';
    const name = document.createElement('h2');
    name.textContent = product.name || 'منتج بدون اسم';
    const productPrice = document.createElement('strong');
    productPrice.textContent = `${price(product.price).toFixed(2)} DH`;
    info.append(category, name, productPrice);
    card.append(visual, info);
    return card;
}

function renderProducts() {
    const searchTerm = searchInput.value.trim().toLocaleLowerCase();
    const sort = sortSelect.value;
    const visibleProducts = allProducts
        .filter((product) => !activeCategory || (product.category?.trim() || 'غير مصنف') === activeCategory)
        .filter((product) => `${product.name || ''} ${product.category || ''} ${product.description || ''}`.toLocaleLowerCase().includes(searchTerm))
        .sort((a, b) => {
            if (sort === 'price-asc') return price(a.price) - price(b.price);
            if (sort === 'price-desc') return price(b.price) - price(a.price);
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

    catalogGrid.replaceChildren();
    updateResultCount(visibleProducts.length);
    if (!visibleProducts.length) {
        const empty = document.createElement('div');
        empty.className = 'catalog-empty';
        const heading = document.createElement('strong');
        heading.textContent = 'لا توجد منتجات مطابقة';
        empty.append(heading, 'جرّب تغيير الفئة أو البحث باسم آخر.');
        catalogGrid.append(empty);
        return;
    }
    visibleProducts.forEach((product) => catalogGrid.append(createCard(product)));
}

async function loadProducts() {
    const { data, error } = await supabase
        .from(tableName)
        .select('id, created_at, name, img, images, price, description, category')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Could not load catalogue:', error);
        catalogGrid.innerHTML = '<div class="catalog-empty"><strong>تعذر تحميل المنتجات</strong>تحقق من إعدادات Supabase ثم أعد المحاولة.</div>';
        return;
    }

    allProducts = data || [];
    renderCategories();
    renderProducts();
}

searchInput.addEventListener('input', renderProducts);
sortSelect.addEventListener('change', renderProducts);
document.querySelector('#clear-filters').addEventListener('click', () => {
    activeCategory = '';
    searchInput.value = '';
    sortSelect.value = 'newest';
    renderCategories();
    renderProducts();
});
document.querySelector('.menu-btn')?.addEventListener('click', () => document.querySelector('.nav-links')?.classList.toggle('active'));

loadProducts();
