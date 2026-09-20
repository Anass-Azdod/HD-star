import { requireAdmin, supabase } from './auth.js';

const tableName = 'hd-store';
const bucketName = 'hd-store';
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.querySelector('.menu-toggle');
const productDialog = document.querySelector('#product-dialog');
const productForm = document.querySelector('#product-form');
const formStatus = document.querySelector('#form-status');
const dialogEyebrow = document.querySelector('#dialog-eyebrow');
const dialogTitle = document.querySelector('#product-dialog-title');
const mainImageInput = document.querySelector('#main-image-input');
const editImageHint = document.querySelector('#edit-image-hint');
const submitButtonEl = document.querySelector('#submit-product-btn');
let editingProduct = null;

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

function openProductForm(product = null) {
    editingProduct = product;
    productForm.reset();
    formStatus.textContent = '';
    formStatus.className = 'form-status';

    if (product) {
        dialogEyebrow.textContent = 'تعديل منتج';
        dialogTitle.textContent = 'تعديل المنتج';
        submitButtonEl.textContent = 'حفظ التعديلات';
        mainImageInput.required = false;
        editImageHint.hidden = false;
        productForm.elements['name'].value = product.name || '';
        productForm.elements['price'].value = product.price ?? '';
        productForm.elements['category'].value = product.category || '';
        productForm.elements['description'].value = product.description || '';
    } else {
        dialogEyebrow.textContent = 'منتج جديد';
        dialogTitle.textContent = 'إضافة منتج';
        submitButtonEl.textContent = 'إضافة المنتج';
        mainImageInput.required = true;
        editImageHint.hidden = true;
    }

    productDialog.showModal();
}

function closeProductForm() {
    productDialog.close();
    editingProduct = null;
}

document.querySelectorAll('.js-open-product-form').forEach((button) => button.addEventListener('click', () => openProductForm()));
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
    const isEditing = Boolean(editingProduct);

    submitButton.disabled = true;
    formStatus.className = 'form-status';
    formStatus.textContent = isEditing ? 'جارٍ حفظ التعديلات...' : 'جارٍ رفع الصور وإضافة المنتج...';

    try {
        const payload = {
            name: fields.get('name').trim(),
            price: Number(fields.get('price')),
            category: fields.get('category').trim(),
            description: fields.get('description').trim()
        };

        const hasNewMainImage = mainImage && mainImage.size > 0;
        if (hasNewMainImage || extraImages.length) {
            const mainImageUrl = hasNewMainImage ? await uploadImage(mainImage) : editingProduct?.img;
            const extraImageUrls = await Promise.all(extraImages.map(uploadImage));
            const existingExtras = isEditing
                ? (Array.isArray(editingProduct.images) ? editingProduct.images.filter((image) => image !== editingProduct.img) : [])
                : [];
            payload.img = mainImageUrl;
            payload.images = [mainImageUrl, ...existingExtras, ...extraImageUrls];
        }

        let error;
        if (isEditing) {
            ({ error } = await supabase.from(tableName).update(payload).eq('id', editingProduct.id));
        } else {
            payload.img = payload.img || (await uploadImage(mainImage));
            payload.images = payload.images || [payload.img];
            ({ error } = await supabase.from(tableName).insert(payload));
        }

        if (error) throw error;

        formStatus.className = 'form-status success';
        formStatus.textContent = isEditing ? 'تم حفظ التعديلات بنجاح.' : 'تمت إضافة المنتج بنجاح.';
        productForm.reset();
        await loadDashboard();
        window.setTimeout(closeProductForm, 700);
    } catch (error) {
        console.error('Could not save product:', error);
        formStatus.className = 'form-status error';
        formStatus.textContent = `تعذر حفظ المنتج: ${error.message}`;
    } finally {
        submitButton.disabled = false;
    }
});

async function deleteProduct(product) {
    const confirmed = window.confirm(`هل أنت متأكد من حذف "${product.name || 'هذا المنتج'}"؟`);
    if (!confirmed) return;

    try {
        const { error } = await supabase.from(tableName).delete().eq('id', product.id);
        if (error) throw error;
        await loadDashboard();
    } catch (error) {
        console.error('Could not delete product:', error);
        window.alert(`تعذر حذف المنتج: ${error.message}`);
    }
}

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

    const actions = document.createElement('div');
    actions.className = 'admin-product-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'row-action edit-action';
    editButton.textContent = 'تعديل';
    editButton.addEventListener('click', () => openProductForm(product));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'row-action delete-action';
    deleteButton.textContent = 'حذف';
    deleteButton.addEventListener('click', () => deleteProduct(product));

    actions.append(editButton, deleteButton);

    row.append(image, details, price, actions);
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
    products.forEach((product) => content.append(createProductRow(product)));
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

const adminUser = await requireAdmin();

if (adminUser) {
    document.querySelector('#admin-email').textContent = adminUser.email;
    document.querySelector('.sign-out')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.replace('login.html');
    });
    loadDashboard();
}
