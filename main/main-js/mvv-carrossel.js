/* ---------- FEEDBACK DE TOQUE NOS BOTÕES DOS CARROSSÉIS ---------- */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.carrossel-btn, .nav-btn');
    if (!btn || btn.disabled) return;
    btn.classList.add('tocado');
    setTimeout(() => btn.classList.remove('tocado'), 350);
});

/* ---------- CARROSSEL MISSÃO, VISÃO E VALORES ---------- */
const container = document.getElementById('mvvContainer');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');

function atualizarBotoesMvv() {
    const maxScroll = container.scrollWidth - container.clientWidth;
    btnPrev.disabled = container.scrollLeft <= 1;
    btnNext.disabled = container.scrollLeft >= maxScroll - 1;
}

btnNext.addEventListener('click', () => {
    container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
});

btnPrev.addEventListener('click', () => {
    container.scrollBy({ left: -container.clientWidth, behavior: 'smooth' });
});

container.addEventListener('scroll', atualizarBotoesMvv, { passive: true });
window.addEventListener('resize', atualizarBotoesMvv);
atualizarBotoesMvv();