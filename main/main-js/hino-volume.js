/* ---------- VOLUME DO HINO ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const audioPage = document.getElementById('audioPage');

    if (audioPage) {
        audioPage.volume = 0.5;

        audioPage.addEventListener('play', () => {
            audioPage.volume = 0.5;
        });
    }
});