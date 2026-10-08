document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];

    const POR_PAGINA = 12;

    const busca = $('#glBusca');
    const data = $('#glData');
    const de = $('#glDe');
    const ate = $('#glAte');
    const contagem = $('#glContagem');
    const vazio = $('#glVazio');
    const grade = $('#glResultados');
    const paginacao = $('#glPaginacao');
    const btnPrev = $('#glPrev');
    const btnNext = $('#glNext');
    const info = $('#glPaginaInfo');
    const cards = $$('.bl-card');

    let filtrados = [...cards];
    let pagina = 1;

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
        const el = $('.bl-card-date', card);
        if (el) {
            el.textContent = `${d}/${m}/${a}`;
            el.setAttribute('datetime', card.dataset.date);
        }
        card._tags = lerTags(card);
    });

    function animarEntrada(card) {
        card.classList.remove('gl-enter');
        void card.offsetWidth;
        card.classList.add('gl-enter');
        card.addEventListener('animationend', () => card.classList.remove('gl-enter'), { once: true });
    }

    /* Cards da página atual */
    function renderizar() {
        const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
        pagina = Math.min(Math.max(pagina, 1), totalPaginas);

        const inicio = (pagina - 1) * POR_PAGINA;
        const daPagina = new Set(filtrados.slice(inicio, inicio + POR_PAGINA));

        let i = 0;
        cards.forEach(card => {
            const mostrar = daPagina.has(card);
            card.hidden = !mostrar;
            if (mostrar) {
                card.style.setProperty('--i', i++);
                animarEntrada(card);
            }
        });

        info.textContent = `Página ${pagina} de ${totalPaginas}`;
        btnPrev.disabled = pagina <= 1;
        btnNext.disabled = pagina >= totalPaginas;
        paginacao.hidden = filtrados.length === 0;
    }

    function filtrar() {
        filtrados = cards.filter(card => {
            const d = card.dataset.date;
            return (
                (!data.value || d === data.value) &&
                (!de.value || d >= de.value) &&
                (!ate.value || d <= ate.value) &&
                (!tagSel || card._tags.has(tagSel))
            );
        });

        pagina = 1;
        renderizar();

        const total = filtrados.length;
        contagem.textContent = total === 1 ? '1 publicação encontrada' : `${total} publicações encontradas`;
        vazio.style.display = total ? 'none' : 'block';
        grade.style.display = total ? '' : 'none';

        renderTags();
    }

    function irParaPagina(nova) {
        pagina = nova;
        renderizar();
        grade.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    btnPrev.addEventListener('click', () => irParaPagina(pagina - 1));
    btnNext.addEventListener('click', () => irParaPagina(pagina + 1));

    [data, de, ate].forEach(el => el.addEventListener('input', filtrar));

    $('#glLimpar').addEventListener('click', () => {
        [data, de, ate].forEach(el => (el.value = ''));
        tagSel = null;
        busca.value = '';
        fecharTags();
        filtrar();
    });

    filtrar();
});