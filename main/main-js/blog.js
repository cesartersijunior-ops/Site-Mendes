/* ---------- CARROSSEL DO BLOG ---------- */
document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById("blogTrack");
    const cards = track ? track.querySelectorAll(".blog-card") : [];
    const prevBtn = document.getElementById("blogPrev");
    const nextBtn = document.getElementById("blogNext");
    const blogAtual = document.getElementById("blogAtual");
    const blogTotal = document.getElementById("blogTotal");

    if (!track || cards.length === 0) return;

    let currentIndex = 0;

    if (blogTotal) {
        blogTotal.textContent = cards.length;
    }

    function getCardsPerPage() {
        const width = window.innerWidth;
        if (width <= 640) return 1;
        if (width <= 992) return 2;
        return 3;
    }

    function updateCarousel() {
        const cardsPerPage = getCardsPerPage();
        const maxIndex = cards.length - cardsPerPage;

        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex > maxIndex) currentIndex = maxIndex < 0 ? 0 : maxIndex;

        const firstCard = cards[0];
        const cardWidth = firstCard.getBoundingClientRect().width;
        const gap = 24;
        const translateX = -(currentIndex * (cardWidth + gap));

        track.style.transform = `translateX(${translateX}px)`;

        if (blogAtual) {
            const currentMaxCard = Math.min(currentIndex + cardsPerPage, cards.length);
            blogAtual.textContent = currentMaxCard;
        }

        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const maxIndex = cards.length - getCardsPerPage();
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateCarousel();
            }
        });
    }

    window.addEventListener("resize", updateCarousel);

    updateCarousel();
});