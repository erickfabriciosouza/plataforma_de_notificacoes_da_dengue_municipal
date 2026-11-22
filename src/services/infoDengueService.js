const { geocodigo } = require('../config/ambiente');

const urlInfoDengue = 'https://info.dengue.mat.br/api/alertcity';
const primeiroAno = 2010;
const hora = 60 * 60 * 1000;
const cache = new Map();
const consultasEmAndamento = new Map();
const recortes = {
    semana: { semanasIndicadores: 1, semanasGrafico: 12 },
    '4semanas': { semanasIndicadores: 4, semanasGrafico: 24 },
    ano: {},
    historico: {}
};

function numeroOuNulo(valor) {
    if (typeof valor === 'string' && valor.trim()) valor = Number(valor);
    return Number.isFinite(valor) ? valor : null;
}

function normalizar(dados) {
    if (!Array.isArray(dados)) throw new Error('A resposta não é uma lista de semanas.');
    const semanas = dados.flatMap(item => {
        const se = numeroOuNulo(item?.SE);
        if (!Number.isInteger(se) || !/^\d{4}(0[1-9]|[1-4]\d|5[0-3])$/.test(String(se))) return [];

        return [{
            se,
            ano: Math.trunc(se / 100),
            casos: numeroOuNulo(item.casos),
            casosEstimados: numeroOuNulo(item.casos_est),
            incidencia: numeroOuNulo(item.p_inc100k),
            nivel: numeroOuNulo(item.nivel),
            rt: numeroOuNulo(item.Rt),
            temperatura: numeroOuNulo(item.tempmed),
            umidade: numeroOuNulo(item.umidmed)
        }];
    });

    if (dados.length && !semanas.length) throw new Error('Nenhuma semana epidemiológica válida na resposta.');
    return semanas.sort((a, b) => a.se - b.se);
}

async function buscarSemanas(anoInicial, anoAtual) {
    const url = new URL(urlInfoDengue);
    url.search = new URLSearchParams({
        geocode: geocodigo, disease: 'dengue', format: 'json',
        ew_start: '1', ew_end: '53', ey_start: String(anoInicial), ey_end: String(anoAtual)
    });
    const resposta = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resposta.ok) throw new Error('O InfoDengue respondeu com HTTP ' + resposta.status + '.');

    return {
        semanas: normalizar(await resposta.json()).filter(item => item.ano >= anoInicial && item.ano <= anoAtual),
        atualizadoEm: new Date().toISOString()
    };
}

async function obterSemanas(historico, anoAtual) {
    const chave = historico ? 'historico' : 'recente';
    const entrada = cache.get(chave);
    if (entrada?.ano === anoAtual && entrada.expiraEm > Date.now()) return entrada.dados;

    const chaveConsulta = chave + anoAtual;
    if (!consultasEmAndamento.has(chaveConsulta)) {
        const anoInicial = historico ? primeiroAno : anoAtual - 1;
        const consulta = buscarSemanas(anoInicial, anoAtual).then(dados => {
            cache.set(chave, { ano: anoAtual, expiraEm: Date.now() + (historico ? 24 : 6) * hora, dados });
            return dados;
        }).finally(() => consultasEmAndamento.delete(chaveConsulta));
        consultasEmAndamento.set(chaveConsulta, consulta);
    }

    return consultasEmAndamento.get(chaveConsulta);
}

function somar(valores) {
    return valores.length ? valores.reduce((total, valor) => total + valor, 0) : null;
}

function calcular(semanas, campo, operacao = somar) {
    return operacao(semanas.map(item => item[campo]).filter(valor => valor !== null));
}

function media(valores) {
    return valores.length ? somar(valores) / valores.length : null;
}

function maiorNivel(valores) {
    const niveis = valores.filter(nivel => [1, 2, 3, 4].includes(nivel));
    return niveis.length ? Math.max(...niveis) : null;
}

function resumir(semanas) {
    return {
        casos: calcular(semanas, 'casos'),
        casosEstimados: calcular(semanas, 'casosEstimados'),
        incidencia: calcular(semanas, 'incidencia'),
        nivel: calcular(semanas, 'nivel', maiorNivel),
        rt: calcular(semanas, 'rt', media)
    };
}

function agruparPorAno(semanas) {
    const grupos = Map.groupBy(semanas, item => item.ano);
    return [...grupos].map(([ano, semanasDoAno]) => ({
        rotulo: String(ano),
        casosEstimados: calcular(semanasDoAno, 'casosEstimados'),
        temperatura: calcular(semanasDoAno, 'temperatura', media),
        umidade: calcular(semanasDoAno, 'umidade', media)
    }));
}

function rotuloSemana(se) {
    const texto = String(se);
    return `SE ${texto.slice(-2)}/${texto.slice(0, 4)}`;
}

function agruparPorSemana(semanas) {
    return semanas.map(item => ({
        rotulo: rotuloSemana(item.se),
        casosEstimados: item.casosEstimados,
        temperatura: item.temperatura,
        umidade: item.umidade
    }));
}

async function consultarIndicadores(recorte) {
    const anoAtual = Number(new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric', timeZone: 'America/Bahia'
    }).format(new Date()));
    const historico = recorte === 'historico';
    const { semanas, atualizadoEm } = await obterSemanas(historico, anoAtual);
    const { semanasIndicadores, semanasGrafico } = recortes[recorte];
    const semanasDoRecorte = recorte === 'ano' ? semanas.filter(item => item.ano === anoAtual) : semanas;
    const selecionadas = semanasIndicadores ? semanasDoRecorte.slice(-semanasIndicadores) : semanasDoRecorte;
    const serieSemanal = semanasGrafico ? semanasDoRecorte.slice(-semanasGrafico) : semanasDoRecorte;
    const serie = historico ? agruparPorAno(semanasDoRecorte) : agruparPorSemana(serieSemanal);
    const picoHistorico = historico
        ? serie.reduce((pico, item) => item.casosEstimados !== null &&
            (!pico || item.casosEstimados > pico.casosEstimados) ? item : pico, null)
        : null;

    return {
        recorte, anoAtual, atualizadoEm,
        periodo: {
            inicio: selecionadas.at(0)?.se ?? null,
            fim: selecionadas.at(-1)?.se ?? null
        },
        indicadores: selecionadas.length ? resumir(selecionadas) : null,
        serie,
        picoHistorico
    };
}

module.exports = { recortes, consultarIndicadores };
