import { isAdmin, supabase } from './auth.js';

const form = document.querySelector('#login-form');
const message = document.querySelector('#login-message');
const button = document.querySelector('#login-button');
const next = new URLSearchParams(window.location.search).get('next') === 'admin.html' ? 'admin.html' : 'admin.html';

function showMessage(text, type = '') {
    message.className = `login-message ${type}`;
    message.textContent = text;
}

async function redirectIfSignedIn() {
    const { data: { user } } = await supabase.auth.getUser();
    if (isAdmin(user)) window.location.replace(next);
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    showMessage('جارٍ تحويلك إلى Google...');

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: new URL('admin.html', window.location.href).href
        }
    });

    if (error) {
        showMessage('تعذر بدء تسجيل الدخول عبر Google.');
        button.disabled = false;
    }
});

if (new URLSearchParams(window.location.search).get('error') === 'not-authorized') {
    showMessage('هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.');
}

redirectIfSignedIn();
