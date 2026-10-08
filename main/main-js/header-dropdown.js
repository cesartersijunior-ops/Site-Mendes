/* ---------- DROPDOWN DO PORTAL ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const btnPortal = document.getElementById('btn-portal');
    const dropdownPortal = document.getElementById('dropdown-portal');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (btnPortal && dropdownPortal) {
        btnPortal.addEventListener('click', (event) => {
            event.stopPropagation();

            const isOpened = dropdownPortal.classList.contains('active');

            dropdownPortal.classList.toggle('active');
            btnPortal.setAttribute('aria-expanded', !isOpened);
        });

        document.addEventListener('click', (event) => {
            if (!dropdownMenu.contains(event.target)) {
                dropdownPortal.classList.remove('active');
                btnPortal.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                dropdownPortal.classList.remove('active');
                btnPortal.setAttribute('aria-expanded', 'false');
            }
        });
    }
});