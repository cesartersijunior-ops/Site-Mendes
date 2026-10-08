document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];

    const busca = $('#glBusca');
    const data = $('#glData');
    const de = $('#glDe');
    const ate = $('#glAte');
    const contagem = $('#glContagem');
    const vazio = $('#glVazio');
    const cards = $$('.gl-card');
    const sections = $$('.gl-section');

    const normalizar = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    /* ================= CATEGORIA (dropdown + digitação, 1 por vez) ================= */
    const painel = $('#glTagsPainel');
    const lista = $('#glTagsLista');
    const btnLimparBusca = $('#glBuscaLimpar');
    const todasTags = new Map();
    let tagSel = null;
    let destaque = -1;

    const capitalizar = t => t.charAt(0).toUpperCase() + t.slice(1);

    function lerTags(card) {
        return new Set(
            (card.dataset.tags || '')
                .split(',')
                .map(t => t.trim())
                .filter(Boolean)
                .map(t => {
                    const k = normalizar(t);
                    if (!todasTags.has(k)) todasTags.set(k, capitalizar(t));
                    return k;
                })
        );
    }

    const opcoes = () => $$('.gl-opt', lista);

    function atualizarBotaoLimpar() {
        btnLimparBusca.hidden = !busca.value;
    }

    // Lista de categorias
    function renderTags() {
        const termo = tagSel ? '' : normalizar(busca.value);
        const chaves = [...todasTags.keys()]
            .filter(k => !termo || k.includes(termo))
            .sort((a, b) => todasTags.get(a).localeCompare(todasTags.get(b), 'pt-BR'));

        lista.innerHTML = '';
        destaque = -1;
        busca.removeAttribute('aria-activedescendant');

        if (!chaves.length) {
            const p = document.createElement('span');
            p.className = 'gl-tags-nenhuma';
            p.textContent = 'Nenhuma categoria encontrada.';
            lista.append(p);
            return;
        }

        chaves.forEach((k, i) => {
            const o = document.createElement('div');
            o.className = 'gl-opt' + (k === tagSel ? ' ativa' : '');
            o.id = 'glOpt' + i;
            o.setAttribute('role', 'option');
            o.setAttribute('aria-selected', k === tagSel ? 'true' : 'false');
            o.dataset.tag = k;
            o.textContent = todasTags.get(k);
            lista.append(o);
        });
    }

    function abrirTags() {
        if (!painel.hidden) return;
        renderTags();
        painel.hidden = false;
        busca.setAttribute('aria-expanded', 'true');
        const ativa = $('.gl-opt.ativa', lista);
        if (ativa) ativa.scrollIntoView({ block: 'nearest' });
    }

    function fecharTags() {
        painel.hidden = true;
        busca.setAttribute('aria-expanded', 'false');
        busca.value = tagSel ? todasTags.get(tagSel) : '';
        atualizarBotaoLimpar();
    }

    function selecionarTag(k) {
        tagSel = k;
        busca.value = todasTags.get(k);
        atualizarBotaoLimpar();
        painel.hidden = true;
        busca.setAttribute('aria-expanded', 'false');
        busca.blur();
        filtrar();
    }

    function limparCategoria() {
        const tinha = tagSel !== null;
        tagSel = null;
        busca.value = '';
        atualizarBotaoLimpar();
        if (tinha) filtrar();
        else renderTags();
    }

    function realcar(i) {
        const ops = opcoes();
        if (!ops.length) return;
        destaque = (i + ops.length) % ops.length;
        ops.forEach((o, j) => o.classList.toggle('destaque', j === destaque));
        ops[destaque].scrollIntoView({ block: 'nearest' });
        busca.setAttribute('aria-activedescendant', ops[destaque].id);
    }

    lista.addEventListener('click', e => {
        const op = e.target.closest('.gl-opt');
        if (op) selecionarTag(op.dataset.tag);
    });

    busca.addEventListener('focus', abrirTags);
    busca.addEventListener('click', abrirTags);

    busca.addEventListener('input', () => {
        if (tagSel) { tagSel = null; filtrar(); }
        atualizarBotaoLimpar();
        if (painel.hidden) { painel.hidden = false; busca.setAttribute('aria-expanded', 'true'); }
        renderTags();
    });

    busca.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            abrirTags();
            realcar(destaque + (e.key === 'ArrowDown' ? 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const ops = opcoes();
            const alvo = ops[destaque] || (busca.value && !tagSel ? ops[0] : null);
            if (alvo) selecionarTag(alvo.dataset.tag);
        } else if (e.key === 'Tab') {
            fecharTags();
        }
    });

    btnLimparBusca.addEventListener('click', limparCategoria);

    [data, de, ate].forEach(el => el.addEventListener('focus', fecharTags));

    // Fecha ao clicar fora
    document.addEventListener('pointerup', e => {
        if (!painel.hidden && !e.target.closest('.gl-combo')) fecharTags();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !painel.hidden) fecharTags();
    });

    cards.forEach(card => {
        const [a, m, d] = card.dataset.date.split('-');
        const el = $('.gl-card-date', card);
        if (el) el.textContent = `${d}/${m}/${a}`;
        card._tags = lerTags(card);
        // Acessibilidade e desempenho
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Ampliar foto: ${$('.gl-card-title', card).textContent}`);
        const im = $('img', card);
        if (im) { im.loading = 'lazy'; im.decoding = 'async'; }
    });

    // Contador de fotos por categoria
    sections.forEach(sec => {
        const h2 = $('h2', sec);
        if (!h2) return;
        const n = document.createElement('span');
        n.className = 'gl-sec-count';
        h2.insertBefore(n, $('.underline', h2));
    });

    function animarEntrada(card) {
        card.classList.remove('gl-enter');
        void card.offsetWidth;
        card.classList.add('gl-enter');
        card.addEventListener('animationend', () => card.classList.remove('gl-enter'), { once: true });
    }

    function filtrar() {
        let total = 0;

        cards.forEach(card => {
            const d = card.dataset.date;
            const ok =
                (!data.value || d === data.value) &&
                (!de.value || d >= de.value) &&
                (!ate.value || d <= ate.value) &&
                (!tagSel || card._tags.has(tagSel));
            const estavaEscondido = card.hidden;
            card.hidden = !ok;
            if (ok) {
                total++;
                if (estavaEscondido) animarEntrada(card);
            }
        });

        sections.forEach(sec => {
            const qtd = $$('.gl-card', sec).filter(c => !c.hidden).length;
            sec.hidden = !qtd;
            const n = $('.gl-sec-count', sec);
            if (n) n.textContent = qtd === 1 ? '1 foto' : `${qtd} fotos`;
        });

        contagem.textContent = total === 1 ? '1 foto encontrada' : `${total} fotos encontradas`;
        vazio.style.display = total ? 'none' : 'block';

        renderTags();
    }

    [data, de, ate].forEach(el => el.addEventListener('input', filtrar));

    $('#glLimpar').addEventListener('click', () => {
        [data, de, ate].forEach(el => (el.value = ''));
        tagSel = null;
        busca.value = '';
        fecharTags();
        filtrar();
    });

    /* ================= VISUALIZADOR (lightbox) ================= */
    const modal = $('#glModal');
    const modalImg = $('#glModalImg');
    const modalLegenda = $('#glModalCaption');
    const wrapper = $('.galeria-modal-wrapper', modal);
    const btnFechar = $('#glModalFechar');

    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'galeria-modal-nav galeria-modal-prev';
    btnPrev.setAttribute('aria-label', 'Foto anterior');
    btnPrev.innerHTML = '&lsaquo;';

    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'galeria-modal-nav galeria-modal-next';
    btnNext.setAttribute('aria-label', 'Próxima foto');
    btnNext.innerHTML = '&rsaquo;';

    wrapper.append(btnPrev, btnNext);

    let fila = [];
    let atual = -1;
    let ultimoFoco = null;

    function mostrar(i) {
        atual = i;
        const card = fila[i];
        const img = $('img', card);
        modalImg.src = img.currentSrc || img.src;
        modalImg.alt = img.alt;
        modalImg.style.animation = 'none';
        void modalImg.offsetWidth;
        modalImg.style.animation = '';

        modalLegenda.textContent = '';
        modalLegenda.append($('.gl-card-title', card).textContent);
        const info = document.createElement('small');
        const dt = $('.gl-card-date', card).textContent;
        info.textContent = `${dt ? dt + ' · ' : ''}${i + 1} de ${fila.length}`;
        modalLegenda.append(info);

        btnPrev.disabled = i === 0;
        btnNext.disabled = i === fila.length - 1;
        const unica = fila.length < 2;
        btnPrev.hidden = btnNext.hidden = unica;

        // Pré-carrega vizinhas
        [i - 1, i + 1].forEach(j => {
            if (fila[j]) new Image().src = $('img', fila[j]).src;
        });
    }

    function abrir(card) {
        fila = cards.filter(c => !c.hidden);
        const i = fila.indexOf(card);
        if (i < 0) return;
        ultimoFoco = document.activeElement;
        mostrar(i);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        btnFechar.focus();
    }

    function fechar() {
        if (!modal.classList.contains('active')) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
        modalImg.removeAttribute('src');
        if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus({ preventScroll: true });
    }

    const ir = d => {
        const j = atual + d;
        if (j >= 0 && j < fila.length) mostrar(j);
    };

    cards.forEach(card => {
        card.addEventListener('click', () => abrir(card));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(card); }
        });
    });

    btnPrev.addEventListener('click', () => ir(-1));
    btnNext.addEventListener('click', () => ir(1));
    btnFechar.addEventListener('click', fechar);

    // Fecha ao clicar no fundo
    modal.addEventListener('click', e => {
        if (e.target === modal || e.target === wrapper || e.target.classList.contains('galeria-modal-container')) fechar();
    });

    document.addEventListener('keydown', e => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') fechar();
        else if (e.key === 'ArrowLeft') ir(-1);
        else if (e.key === 'ArrowRight') ir(1);
    });

    // Deslizar para trocar de foto
    let tx = 0, ty = 0;
    modal.addEventListener('touchstart', e => {
        tx = e.changedTouches[0].clientX;
        ty = e.changedTouches[0].clientY;
    }, { passive: true });
    modal.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - tx;
        const dy = e.changedTouches[0].clientY - ty;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) ir(dx < 0 ? 1 : -1);
    }, { passive: true });

    filtrar();
});