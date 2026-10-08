/* ==========================================================================
   AGENDAMENTO DE VISITA
   ========================================================================== */

// Guarda as opções originais do select de horário (para poder refiltrar)
let opcoesOriginaisHorario = null;

// Data de hoje no formato AAAA-MM-DD (calculada na hora, no fuso do aparelho)
function dataDeHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Um horário "já passou" se for hoje e a hora da opção <= hora atual
function horarioJaPassou(valorOpcao) {
    const horaOpcao = parseInt(valorOpcao.split(':')[0], 10);
    return horaOpcao <= new Date().getHours();
}

// Mensagem de erro visível abaixo do campo de data
function mostrarErroData(texto) {
    const dataInput = document.getElementById('data-visita');
    if (!dataInput) return;

    let erro = document.getElementById('erro-data-visita');
    if (!erro) {
        erro = document.createElement('small');
        erro.id = 'erro-data-visita';
        erro.setAttribute('role', 'alert');
        erro.style.cssText = 'display:none;color:#dc2626;font-size:13px;font-weight:600;line-height:1.4;';
        dataInput.insertAdjacentElement('afterend', erro);
    }

    erro.textContent = texto || '';
    erro.style.display = texto ? 'block' : 'none';
}

// Garante que a data não é passada. Retorna true se está ok.
function validarData() {
    const dataInput = document.getElementById('data-visita');
    if (!dataInput) return true;

    if (dataInput.value && dataInput.value < dataDeHoje()) {
        dataInput.value = '';
        mostrarErroData('Escolha uma data a partir de hoje.');
        return false;
    }

    mostrarErroData('');
    return true;
}

// Refaz a lista de horários, REMOVENDO os que já passaram (se a data for hoje).
function atualizarHorariosDisponiveis() {
    const dataInput = document.getElementById('data-visita');
    const horarioSelect = document.getElementById('periodo');
    if (!dataInput || !horarioSelect || !opcoesOriginaisHorario) return;

    const selecionado = horarioSelect.value;
    const ehHoje = dataInput.value === dataDeHoje();

    horarioSelect.innerHTML = '';

    opcoesOriginaisHorario.forEach((no) => {
        const clone = no.cloneNode(true);

        if (clone.tagName === 'OPTGROUP') {
            clone.querySelectorAll('option').forEach((opt) => {
                if (ehHoje && opt.value && horarioJaPassou(opt.value)) opt.remove();
            });
            if (clone.querySelectorAll('option').length === 0) return;
        } else if (clone.tagName === 'OPTION' && clone.value && ehHoje && horarioJaPassou(clone.value)) {
            return;
        }

        horarioSelect.appendChild(clone);
    });

    const aindaExiste = Array.from(horarioSelect.options).some(
        (o) => o.value && o.value === selecionado
    );
    horarioSelect.value = aindaExiste ? selecionado : '';

    const temHorario = Array.from(horarioSelect.options).some((o) => o.value);
    if (ehHoje && !temHorario) {
        mostrarErroData('Não há mais horários disponíveis hoje. Escolha outra data.');
    }
}

// Valida data + horário e atualiza a lista
function atualizarAgendamento() {
    validarData();
    atualizarHorariosDisponiveis();
}

document.addEventListener('DOMContentLoaded', () => {
    const dataInput = document.getElementById('data-visita');
    const horarioSelect = document.getElementById('periodo');
    const nomeInput = document.getElementById('nome-responsavel');
    const telefoneInput = document.getElementById('telefone');

    /* ==========================================================================
       1. BLOQUEIO DE DATAS E HORÁRIOS PASSADOS
       ========================================================================== */
    if (dataInput && horarioSelect) {
        opcoesOriginaisHorario = Array.from(horarioSelect.children).map((n) => n.cloneNode(true));

        dataInput.setAttribute('min', dataDeHoje());

        dataInput.addEventListener('change', atualizarAgendamento);
        dataInput.addEventListener('input', atualizarAgendamento);
        dataInput.addEventListener('blur', atualizarAgendamento);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) atualizarAgendamento();
        });

        atualizarAgendamento();
    }

    /* ==========================================================================
       2. FORMATAÇÃO AUTOMÁTICA DO NOME (INICIAIS MAIÚSCULAS)
       ========================================================================== */
    if (nomeInput) {
        nomeInput.setAttribute('autocapitalize', 'words');

        nomeInput.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            const value = e.target.value;

            const formattedValue = value.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());

            if (formattedValue !== value) {
                e.target.value = formattedValue;
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            }
        });
    }

    /* ==========================================================================
       3. MÁSCARA E VALIDAÇÃO DO TELEFONE / WHATSAPP
       ========================================================================== */
    if (telefoneInput) {
        telefoneInput.setAttribute('maxlength', '15');
        telefoneInput.setAttribute('inputmode', 'tel');

        telefoneInput.addEventListener('input', (e) => {
            let value = e.target.value;

            value = value.replace(/\D/g, '');

            value = value.substring(0, 11);

            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d*)$/, '($1');
            }

            e.target.value = value;

            telefoneInput.setCustomValidity('');
        });

        telefoneInput.addEventListener('invalid', () => {
            const apenasNumeros = telefoneInput.value.replace(/\D/g, '');

            if (apenasNumeros.length === 0) {
                telefoneInput.setCustomValidity('Por favor, preencha o número de telefone/WhatsApp.');
            } else if (apenasNumeros.length < 10) {
                telefoneInput.setCustomValidity('Por favor, insira o número de telefone completo com DDD (mínimo de 10 dígitos).');
            }
        });
    }
});

/* ==========================================================================
   4. MANIPULAÇÃO DO ENVIO DO FORMULÁRIO
   ========================================================================== */
function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const dataInput = document.getElementById('data-visita');
    const horarioSelect = document.getElementById('periodo');
    const telefoneInput = document.getElementById('telefone');

    if (dataInput && dataInput.value && dataInput.value < dataDeHoje()) {
        validarData();
        dataInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (dataInput && horarioSelect && dataInput.value === dataDeHoje()
        && horarioSelect.value && horarioJaPassou(horarioSelect.value)) {
        atualizarHorariosDisponiveis();
        horarioSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (telefoneInput) {
        const apenasNumeros = telefoneInput.value.replace(/\D/g, '');

        if (apenasNumeros.length < 10) {
            telefoneInput.setCustomValidity('Por favor, insira o número de telefone completo com DDD (mínimo de 10 dígitos).');
            telefoneInput.reportValidity();
            return;
        } else {
            telefoneInput.setCustomValidity('');
        }
    }

    const feedbackMessage = document.getElementById('feedbackMessage');

    if (feedbackMessage) {
        feedbackMessage.classList.add('active');
        form.reset();
        atualizarAgendamento();

        setTimeout(() => {
            feedbackMessage.classList.remove('active');
        }, 5000);
    }
}