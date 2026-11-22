const botoesRecorte = document.querySelectorAll('[data-recorte]');
const areaDados = document.querySelector('#dados-painel');
const mensagemPainel = document.querySelector('#estado-painel');
const botaoTentar = document.querySelector('#tentar-novamente');
const atualizacao = document.querySelector('#atualizacao');
const tempoAtualizacao = atualizacao.querySelector('time');
const estilos = getComputedStyle(document.documentElement);
const graficos = [];
let consultaAtual;
let recorteAtual = 'semana';

const cores = {
    casos: estilos.getPropertyValue('--cor-casos').trim(),
    temperatura: estilos.getPropertyValue('--cor-temperatura').trim(),
    umidade: estilos.getPropertyValue('--cor-umidade').trim(),
    texto: estilos.getPropertyValue('--cor-texto-secundario').trim(),
    grade: estilos.getPropertyValue('--cor-borda').trim()
};

const formatoInteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const formatoDecimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const formatoData = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bahia'
});

function texto(seletor, conteudo) {
    document.querySelector(seletor).textContent = conteudo;
}

function numero(valor, formato = formatoInteiro) {
    return valor === null ? '—' : formato.format(valor);
}

function semana(se) {
    const codigo = String(se);
    return `SE ${codigo.slice(-2)}/${codigo.slice(0, 4)}`;
}

function preencherIndicadores({ indicadores, recorte, periodo }) {
    const { casos, casosEstimados, incidencia, nivel, rt } = indicadores;
    const nomesNivel = { 1: 'Verde', 2: 'Amarelo', 3: 'Laranja', 4: 'Vermelho' };
    const nivelElemento = document.querySelector('#valor-nivel');
    const detalheNivel = recorte === 'semana' ? 'Nível da semana' : 'Maior nível no período';

    texto('#periodo', periodo.inicio === periodo.fim
        ? 'Semana mais recente na fonte · ' + semana(periodo.fim)
        : semana(periodo.inicio) + ' a ' + semana(periodo.fim));
    texto('#valor-casos', numero(casos) + ' / ' + numero(casosEstimados));
    nivelElemento.textContent = nivel === null ? '—' : `Nível ${nivel} · ${nomesNivel[nivel]}`;
    nivelElemento.dataset.nivel = nivel ?? '';
    texto('#detalhe-nivel', nivel === null ? 'Sem dado na fonte' : detalheNivel);

    const rtDoCartao = rt === null ? null : Number(rt.toFixed(2));
    let detalheRt = 'Sem dado na fonte';
    if (rtDoCartao !== null) {
        if (rtDoCartao > 1) detalheRt = 'Rt > 1 · Transmissão em alta';
        else if (rtDoCartao < 1) detalheRt = 'Rt < 1 · Transmissão em queda';
        else detalheRt = 'Rt = 1 · Transmissão estável';
        if (recorte !== 'semana') detalheRt = 'Média · ' + detalheRt;
    }
    texto('#valor-rt', numero(rtDoCartao, formatoDecimal));
    texto('#detalhe-rt', detalheRt);
    texto('#valor-incidencia', numero(incidencia, formatoDecimal));
}

function preencherTabela(serie) {
    const linhas = serie.map(item => {
        const linha = document.createElement('tr');
        const titulo = document.createElement('th');
        titulo.scope = 'row';
        titulo.textContent = item.rotulo;
        linha.append(titulo);
        const valores = [numero(item.casosEstimados), numero(item.temperatura, formatoDecimal), numero(item.umidade, formatoDecimal)];
        for (const valor of valores) {
            const celula = document.createElement('td');
            celula.textContent = valor;
            linha.append(celula);
        }
        return linha;
    });
    document.querySelector('#tabela-serie').replaceChildren(...linhas);
}

function eixoVertical(unidade, cor, posicao = 'left') {
    return {
        type: 'linear',
        position: posicao,
        title: { display: true, text: unidade, color: cor, font: { weight: 600 } },
        grid: { color: cores.grade, drawOnChartArea: posicao === 'left' },
        ticks: { color: cor, maxTicksLimit: 6 }
    };
}

function opcoesGrafico(eixos) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: cores.texto, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
            ...eixos
        }
    };
}

function destruirGraficos() {
    for (const grafico of graficos) grafico.destroy();
    graficos.length = 0;
}

function desenharGraficos(serie) {
    if (typeof Chart === 'undefined') throw new Error('Biblioteca de gráficos indisponível.');

    const labels = serie.map(item => item.rotulo);
    Chart.defaults.font.family = 'Inter, sans-serif';
    graficos.push(new Chart(document.querySelector('#grafico-casos'), {
        type: 'bar',
        data: { labels, datasets: [{
            label: 'Casos estimados',
            data: serie.map(item => item.casosEstimados === null ? null : Math.round(item.casosEstimados)),
            backgroundColor: cores.casos,
            borderRadius: 3,
            maxBarThickness: 34
        }] },
        options: opcoesGrafico({ y: { ...eixoVertical('Casos', cores.texto), beginAtZero: true } })
    }));

    graficos.push(new Chart(document.querySelector('#grafico-clima'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Temperatura (°C)',
                data: serie.map(item => item.temperatura),
                borderColor: cores.temperatura,
                backgroundColor: cores.temperatura,
                yAxisID: 'temperatura',
                borderWidth: 2,
                pointRadius: 2,
                spanGaps: false
            }, {
                label: 'Umidade (%)',
                data: serie.map(item => item.umidade),
                borderColor: cores.umidade,
                backgroundColor: cores.umidade,
                yAxisID: 'umidade',
                borderDash: [5, 4],
                borderWidth: 2,
                pointRadius: 2,
                spanGaps: false
            }]
        },
        options: opcoesGrafico({
            temperatura: eixoVertical('°C', cores.temperatura),
            umidade: { ...eixoVertical('%', cores.umidade, 'right'), suggestedMax: 100 }
        })
    }));
}

function mostrarSerie({ serie, picoHistorico, recorte, anoAtual }) {
    const recortesRecentes = { semana: 12, '4semanas': 24 };
    const semanas = recortesRecentes[recorte];
    const descricao = {
        ano: `Semanas publicadas de ${anoAtual}`,
        historico: `Totais e médias anuais · 2010 a ${anoAtual}`
    };
    let periodo = descricao[recorte];
    if (semanas) {
        periodo = serie.length === semanas
            ? `Últimas ${semanas} semanas publicadas`
            : `${serie.length} de até ${semanas} semanas publicadas`;
    }
    texto('#periodo-grafico', periodo);

    const pico = document.querySelector('#pico-historico');
    pico.hidden = picoHistorico === null;
    if (picoHistorico) {
        pico.textContent = `Pico anual em ${picoHistorico.rotulo} · ${numero(picoHistorico.casosEstimados)} casos estimados`;
    }

    preencherTabela(serie);
    desenharGraficos(serie);
}

function mostrarEstado(mensagem, erro = false) {
    mensagemPainel.textContent = mensagem;
    mensagemPainel.hidden = !mensagem;
    mensagemPainel.classList.toggle('aviso-erro', erro);
}

async function carregarRecorte(recorte) {
    recorteAtual = recorte;
    consultaAtual?.abort();
    const consulta = new AbortController();
    consultaAtual = consulta;

    for (const botao of botoesRecorte) botao.setAttribute('aria-pressed', String(botao.dataset.recorte === recorte));
    destruirGraficos();
    areaDados.hidden = true;
    atualizacao.hidden = true;
    botaoTentar.hidden = true;
    mostrarEstado('Carregando indicadores do InfoDengue…');

    try {
        const resposta = await fetch('/api/indicadores?recorte=' + encodeURIComponent(recorte), { signal: consulta.signal });
        const dados = await resposta.json();
        if (consulta.signal.aborted) return;
        if (!resposta.ok) {
            mostrarEstado(dados.erro || 'Não foi possível carregar os indicadores.', true);
            botaoTentar.hidden = false;
            return;
        }

        tempoAtualizacao.dateTime = dados.atualizadoEm;
        tempoAtualizacao.textContent = formatoData.format(new Date(dados.atualizadoEm));
        atualizacao.hidden = false;
        if (!dados.indicadores) {
            mostrarEstado('O InfoDengue ainda não publicou dados para este recorte.');
            return;
        }

        preencherIndicadores(dados);
        areaDados.hidden = false;
        mostrarSerie(dados);
        mostrarEstado('');
    } catch {
        if (consulta.signal.aborted) return;
        destruirGraficos();
        areaDados.hidden = true;
        mostrarEstado('Não foi possível carregar o painel. Verifique sua conexão e tente novamente.', true);
        botaoTentar.hidden = false;
    }
}

for (const botao of botoesRecorte) botao.addEventListener('click', () => carregarRecorte(botao.dataset.recorte));
botaoTentar.addEventListener('click', () => carregarRecorte(recorteAtual));
carregarRecorte(recorteAtual);
