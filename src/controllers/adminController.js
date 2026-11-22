const { fn, col, literal } = require('sequelize');
const { Foco, tiposLocal, situacoes } = require('../models/Foco');
const { ErroHttp } = require('../middlewares/erros');

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bahia'
});

const acoes = {
    aprovar: { origem: 'pendente', destino: 'aprovado', mensagem: 'Foco aprovado e publicado no mapa.' },
    rejeitar: { origem: 'pendente', destino: 'rejeitado', mensagem: 'Foco rejeitado.' },
    resolver: { origem: 'aprovado', destino: 'resolvido', mensagem: 'Foco resolvido e retirado do mapa.' }
};

function lerId(valor) {
    if (!/^[1-9]\d{0,9}$/.test(valor) || Number(valor) > 2147483647) {
        throw new ErroHttp(404, 'Foco não encontrado.');
    }
    return Number(valor);
}

function lerFiltro(valor, padrao = 'pendente') {
    return typeof valor === 'string' && Object.hasOwn(situacoes, valor) ? valor : padrao;
}

exports.listar = async (req, res) => {
    const filtro = lerFiltro(req.query.status);
    const [focos, totais] = await Promise.all([
        Foco.findAll({
            where: { status: filtro },
            // Traz só a informação de que existe foto, sem carregar a imagem em si.
            attributes: { include: [[literal('"foto" IS NOT NULL'), 'temFoto']] },
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        }),
        Foco.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'total']], group: ['status'], raw: true })
    ]);

    res.render('admin/moderacao', {
        focos, filtro, tiposLocal, situacoes,
        contadores: Object.fromEntries(totais.map(({ status, total }) => [status, Number(total)])),
        formatarData: data => formatadorData.format(data)
    });
};

exports.foto = async (req, res) => {
    const foco = await Foco.unscoped().findByPk(lerId(req.params.id), { attributes: ['foto'] });
    if (!foco?.foto) throw new ErroHttp(404, 'Foto não encontrada.');

    // Toda foto foi convertida para WebP no envio (ver config/upload.js).
    res.set('Cache-Control', 'private, no-store');
    res.type('image/webp').send(foco.foto);
};

exports.moderar = async (req, res) => {
    const id = lerId(req.params.id);
    const acao = req.params.acao;
    if (!Object.hasOwn(acoes, acao)) throw new ErroHttp(404, 'Ação não encontrada.');

    const { origem, destino, mensagem } = acoes[acao];
    const filtro = lerFiltro(req.body.filtro, origem);
    const motivo = typeof req.body.motivo === 'string' ? req.body.motivo.trim() : '';
    if (acao === 'rejeitar' && motivo.length > 300) {
        req.flash('erro', 'O motivo da rejeição deve ter até 300 caracteres.');
        return res.redirect(303, '/admin?status=' + filtro);
    }

    const [total] = await Foco.update({
        status: destino,
        motivoRejeicao: acao === 'rejeitar' ? motivo || null : null,
        moderadoPor: req.session.administradorId,
        moderadoEm: new Date()
    }, { where: { id, status: origem } });

    if (total) req.flash('sucesso', mensagem);
    else req.flash('erro', 'O registro não está mais disponível para essa ação.');
    res.redirect(303, '/admin?status=' + filtro);
};

exports.excluir = async (req, res) => {
    const id = lerId(req.params.id);
    const filtro = lerFiltro(req.body.filtro);
    // Como a foto está na mesma linha do banco, excluir o foco já remove a foto.
    if (await Foco.destroy({ where: { id } })) {
        req.flash('sucesso', 'Foco excluído.');
    } else {
        req.flash('erro', 'O registro já foi removido.');
    }

    res.redirect(303, '/admin?status=' + filtro);
};
