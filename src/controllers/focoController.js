const { Foco, tiposLocal } = require('../models/Foco');
const municipio = require('../config/municipio');
const { receberFoto, prepararFoto } = require('../config/upload');

async function renderizarMapa(res, campos = {}, avisos = [], status = 200) {
    const focos = await Foco.findAll({
        where: { status: 'aprovado' },
        attributes: ['id', 'latitude', 'longitude', 'descricao', 'tipoLocal'],
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    res.status(status).render('mapa', { focos, municipio, tiposLocal, campos, avisos });
}

exports.listar = (req, res) => renderizarMapa(res);

exports.lerFormulario = (req, res, next) => {
    receberFoto(req, res, erro => {
        if (!erro) return next();
        const mensagem = erro.code === 'LIMIT_FILE_SIZE'
            ? 'A foto deve ter até 5 MB.'
            : 'Não foi possível ler o formulário. Envie uma única foto e confira os campos.';
        renderizarMapa(res, req.body, [mensagem], erro.code === 'LIMIT_FILE_SIZE' ? 413 : 400).catch(next);
    });
};

function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

function coordenada(valor) {
    return /^-?\d+(?:[.,]\d+)?$/.test(valor) ? Number(valor.replace(',', '.')) : NaN;
}

exports.criar = async (req, res) => {
    const campos = {
        descricao: texto(req.body.descricao),
        tipoLocal: texto(req.body.tipoLocal),
        latitude: texto(req.body.latitude),
        longitude: texto(req.body.longitude),
        contato: texto(req.body.contato)
    };
    const avisos = [];
    const latitude = coordenada(campos.latitude);
    const longitude = coordenada(campos.longitude);
    const { limites } = municipio;

    if (campos.descricao.length < 10 || campos.descricao.length > 300) {
        avisos.push('A descrição deve ter de 10 a 300 caracteres.');
    }
    if (!Object.hasOwn(tiposLocal, campos.tipoLocal)) avisos.push('Selecione um tipo de local válido.');
    if (campos.contato.length > 150) avisos.push('O nome ou contato deve ter até 150 caracteres.');
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        avisos.push('Indique a localização no mapa ou preencha a latitude e a longitude.');
    } else if (latitude < limites.latitudeMinima || latitude > limites.latitudeMaxima ||
        longitude < limites.longitudeMinima || longitude > limites.longitudeMaxima) {
        avisos.push('As coordenadas estão fora da área de Santo Amaro (BA). Ajuste o ponto para enviar.');
    }

    if (avisos.length) return renderizarMapa(res, campos, avisos, 422);

    let foto = null;
    if (req.file) {
        try {
            foto = await prepararFoto(req.file);
        } catch {
            return renderizarMapa(res, campos, ['Envie uma foto JPG, PNG ou WebP válida, com até 50 megapixels.'], 422);
        }
    }

    // A foto é gravada junto com o foco, na mesma operação: os dois nunca se separam.
    await Foco.create({ ...campos, latitude, longitude, contato: campos.contato || null, foto });

    req.flash('sucesso', 'Registro recebido. Ele será analisado pela equipe antes de aparecer no mapa.');
    res.redirect(303, '/mapa');
};
