import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    'https://gkwkorqpktidgxladvzi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2tvcnFwa3RpZGd4bGFkdnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzNzAsImV4cCI6MjA4OTU5MjM3MH0.hBT4v2wUyn2KRme6dutz4cK0pApZyF9fonRb0DPyQxM'
);

const tableName = 'hd-store';
const bucketName = 'hd-store';
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.querySelector('.menu-toggle');
const productDialog = document.querySelector('#product-dialog');
const productForm = document.querySelector('#product-form');
const formStatus = document.querySelector('#form-status');

menuToggle?.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
});

document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
        document.querySelector('.nav-item.active')?.classList.remove('active');
        item.classList.add('active');
        sidebar.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded', 'false');
    });
});

function openProductForm() {
    formStatus.textContent = '';
    formStatus.className = 'form-status';
    productDialog.showModal();
}

function closeProductForm() {
    productDialog.close();
}

document.querySelectorAll('.js-open-product-form').forEach((button) => button.addEventListener('click', openProductForm));
document.querySelector('.close-dialog')?.addEventListener('click', closeProductForm);
document.querySelector('.cancel-dialog')?.addEventListener('click', closeProductForm);

productDialog?.addEventListener('click', (event) => {
    if (event.target === productDialog) closeProductForm();
});

async function uploadImage(file) {
    const extension = file.name.split('.').pop() || 'jpg';
    const filePath = Date.now()+'-'+ file.name;
    const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
    });

    if (error) throw error;
    return supabase.storage.from(bucketName).getPublicUrl(filePath).data.publicUrl;
}

productForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = productForm.querySelector('.submit-product');
    const fields = new FormData(productForm);
    const mainImage = fields.get('main-image');
    const extraImages = fields.getAll('extra-images').filter((file) => file.size > 0);

    submitButton.disabled = true;
    formStatus.className = 'form-status';
    formStatus.textContent = 'جارٍ رفع الصور وإضافة المنتج...';

    try {
        const mainImageUrl = await uploadImage(mainImage);
        const extraImageUrls = await Promise.all(extraImages.map(uploadImage));
        const imageUrls = [mainImageUrl, ...extraImageUrls];
        const { error } = await supabase.from(tableName).insert({
            name: fields.get('name').trim(),
            price: Number(fields.get('price')),
            category: fields.get('category').trim(),
            description: fields.get('description').trim(),
            img: mainImageUrl,
            images: imageUrls
        });

        if (error) throw error;

        formStatus.className = 'form-status success';
        formStatus.textContent = 'تمت إضافة المنتج بنجاح.';
        productForm.reset();
        await loadDashboard();
        window.setTimeout(closeProductForm, 700);
    } catch (error) {
        console.error('Could not create product:', error);
        formStatus.className = 'form-status error';
        formStatus.textContent = `تعذر إضافة المنتج: ${error.message}`;
    } finally {
        submitButton.disabled = false;
    }
});

function getImageUrl(product) {
    const image = product.img || (Array.isArray(product.images) ? product.images[0] : null);

    if (!image || typeof image !== 'string') return '';
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) return image;

    return supabase.storage.from(bucketName).getPublicUrl(image).data.publicUrl;
}

function createProductRow(product) {
    const row = document.createElement('article');
    row.className = 'admin-product-row';

    const image = document.createElement('img');
    image.className = 'admin-product-image';
    image.alt = product.name || 'Product image';
    image.src = getImageUrl(product);
    image.addEventListener('error', () => image.classList.add('image-missing'));

    const details = document.createElement('div');
    details.className = 'admin-product-details';
    const name = document.createElement('strong');
    name.textContent = product.name || 'منتج بدون اسم';
    const category = document.createElement('span');
    category.textContent = product.category || 'بدون فئة';
    details.append(name, category);

    const price = document.createElement('p');
    price.className = 'admin-product-price';
    price.textContent = `${Number(product.price || 0).toFixed(2)} DH`;

    row.append(image, details, price);
    return row;
}

function renderProducts(products) {
    const content = document.querySelector('#products-content');
    if (!content) return;

    content.replaceChildren();
    if (!products.length) {
        content.className = 'empty-products';
        content.innerHTML = '<div class="empty-icon">▦</div><h3>لا توجد منتجات بعد</h3><p>أضف أول منتج ليظهر هنا وفي واجهة المتجر.</p>';
        return;
    }

    content.className = 'admin-products-list';
    products.slice(0, 5).forEach((product) => content.append(createProductRow(product)));
}

async function loadDashboard() {
    const { data: products, error } = await supabase
        .from(tableName)
        .select('id, created_at, name, img, images, price, description, category')
        .order('created_at', { ascending: false });

    const productsCount = document.querySelector('#products-count');
    const productsStatus = document.querySelector('#products-status');
    const categoriesCount = document.querySelector('#categories-count');
    const categoriesStatus = document.querySelector('#categories-status');

    if (error) {
        console.error('Could not load products:', error);
        productsStatus.textContent = 'تعذر تحميل المنتجات';
        categoriesStatus.textContent = 'تعذر تحميل الفئات';
        return;
    }

    const categories = new Set(products.map((product) => product.category?.trim()).filter(Boolean));
    productsCount.textContent = products.length;
    productsStatus.textContent = 'من قاعدة البيانات';
    categoriesCount.textContent = categories.size;
    categoriesStatus.textContent = 'فئات نشطة';
    renderProducts(products);
}

loadDashboard();
