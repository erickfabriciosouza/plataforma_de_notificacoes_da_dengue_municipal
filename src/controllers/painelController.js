const { recortes, consultarIndicadores } = require('../services/infoDengueService');

exports.indicadores = async (req, res) => {
    const recorte = req.query.recorte ?? 'semana';
    if (typeof recorte !== 'string' || !Object.hasOwn(recortes, recorte)) {
        return res.status(400).json({ erro: 'Escolha um recorte válido.' });
    }

    try {
        const dados = await consultarIndicadores(recorte);
        res.json(dados);
    } catch (erro) {
        console.warn('Falha na consulta ao InfoDengue:', erro.message);
        res.status(502).json({ erro: 'O InfoDengue está indisponível no momento. Tente novamente em alguns instantes.' });
    }
};
