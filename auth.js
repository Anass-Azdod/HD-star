import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
    'https://gkwkorqpktidgxladvzi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2tvcnFwa3RpZGd4bGFkdnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzNzAsImV4cCI6MjA4OTU5MjM3MH0.hBT4v2wUyn2KRme6dutz4cK0pApZyF9fonRb0DPyQxM'
);

// Replace this with the same email used in your RLS policies.
export const ADMIN_EMAILS = ['YOUR_ADMIN_EMAIL@example.com'];

export function isAdmin(user) {
    return Boolean(user?.email) && ADMIN_EMAILS.some((email) => email.toLowerCase() === user.email.toLowerCase());
}

export async function requireAdmin() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.replace('login.html?next=admin.html');
        return null;
    }

    if (!isAdmin(user)) {
        await supabase.auth.signOut();
        window.location.replace('login.html?error=not-authorized');
        return null;
    }

    document.body.classList.remove('admin-pending');
    return user;
}
