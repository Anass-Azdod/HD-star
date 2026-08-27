const sidebar = document.querySelector('.sidebar');
const menuToggle = document.querySelector('.menu-toggle');

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
