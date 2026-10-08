/* ---------- MENU HAMBÚRGUER (telas até 1100px) ---------- */
(function () {
    function iniciarMenuHamburguer() {
        const toggle = document.getElementById('menuToggle');
        const menu = document.getElementById('headerMenu');

        if (!toggle || !menu) return;

        if (toggle.dataset.menuPronto === 'true') return;
        toggle.dataset.menuPronto = 'true';

        const BREAKPOINT = 1100;

        function fecharPortal() {
            const dropdown = document.getElementById('dropdown-portal');
            const btnPortal = document.getElementById('btn-portal');
            if (dropdown) dropdown.classList.remove('active');
            if (btnPortal) btnPortal.setAttribute('aria-expanded', 'false');
        }

        function setMenu(aberto) {
            menu.classList.toggle('open', aberto);
            toggle.classList.toggle('active', aberto);
            toggle.setAttribute('aria-expanded', String(aberto));
            toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
            if (!aberto) fecharPortal();
        }

        toggle.addEventListener('click', () => {
            setMenu(!menu.classList.contains('open'));
        });

        menu.querySelectorAll('a.nav-link, a.btn-visita').forEach((link) => {
            link.addEventListener('click', () => setMenu(false));
        });

        document.addEventListener('click', (e) => {
            if (!menu.classList.contains('open')) return;
            if (menu.contains(e.target) || toggle.contains(e.target)) return;
            setMenu(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('open')) {
                setMenu(false);
                toggle.focus();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > BREAKPOINT) setMenu(false);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarMenuHamburguer);
    } else {
        iniciarMenuHamburguer();
    }
})();