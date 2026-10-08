/* ---------- GALERIA: CARROSSEL ---------- */
function initGaleriaCarrossel() {
    const track = document.getElementById('galeriaTrack');
    const prevBtn = document.getElementById('galeriaPrev');
    const nextBtn = document.getElementById('galeriaNext');
    const atualEl = document.getElementById('galeriaAtual');
    const totalEl = document.getElementById('galeriaTotal');
    const cards = document.querySelectorAll('.galeria-card');

    if (!track || cards.length === 0) return;

    let currentIndex = 0;

    function getVisibleCards() {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 900) return 2;
        return 3;
    }

    function updateCarousel() {
        const visibleCards = getVisibleCards();
        const maxIndex = Math.max(0, cards.length - visibleCards);

        if (currentIndex > maxIndex) currentIndex = maxIndex;

        const cardWidth = cards[0].offsetWidth + 24;
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

        const imagemInicial = Math.min(currentIndex + visibleCards, cards.length);

        if (atualEl) atualEl.textContent = imagemInicial;
        if (totalEl) totalEl.textContent = cards.length;

        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const maxIndex = Math.max(0, cards.length - getVisibleCards());
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateCarousel();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
    }

    window.addEventListener('resize', updateCarousel);
    updateCarousel();
}

/* ---------- GALERIA: ZOOM (MODAL) ---------- */
function initGaleriaZoom() {
    const modal = document.getElementById('galeria-modal');
    const modalImg = document.getElementById('galeria-modal-img');
    const modalCaption = document.getElementById('galeria-modal-caption');
    const closeBtn = document.querySelector('.galeria-modal-close');
    const prevBtn = document.querySelector('.galeria-modal-prev');
    const nextBtn = document.querySelector('.galeria-modal-next');

    if (!modal) return;

    const cards = Array.from(document.querySelectorAll('.galeria-card'));
    let currentIndex = 0;

    const atualizarModal = (index) => {
        const card = cards[index];
        if (!card) return;

        const img = card.querySelector('img');
        const title = card.querySelector('.galeria-card-title');

        if (img) {
            modalImg.src = img.src;
            modalImg.alt = img.alt || '';
            modalCaption.textContent = title ? title.textContent : '';
        }
    };

    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            currentIndex = index;
            atualizarModal(currentIndex);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    const proximaImagem = () => {
        currentIndex = (currentIndex + 1) % cards.length;
        atualizarModal(currentIndex);
    };

    const imagemAnterior = () => {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        atualizarModal(currentIndex);
    };

    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); proximaImagem(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); imagemAnterior(); });

    const fecharModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    if (closeBtn) closeBtn.addEventListener('click', fecharModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });

    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;

        if (e.key === 'ArrowRight') proximaImagem();
        if (e.key === 'ArrowLeft') imagemAnterior();
        if (e.key === 'Escape') fecharModal();
    });
}

/* ---------- GALERIA: INICIALIZAÇÃO ---------- */
document.addEventListener('DOMContentLoaded', () => {
    initGaleriaCarrossel();
    initGaleriaZoom();
});