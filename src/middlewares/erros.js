class ErroHttp extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}

function paginaNaoEncontrada(req, res) {
    res.status(404).render('404');
}

function tratarErro(erro, req, res, next) {
    if (res.headersSent) return next(erro);

    const status = erro.status >= 400 && erro.status < 500 ? erro.status : 500;
    if (status === 500) console.error('Falha na aplicação:', erro.name, erro.code || '');

    if (req.path.startsWith('/api/')) {
        return res.status(status).json({
            erro: status === 500 ? 'Não foi possível processar a consulta.' : 'Consulta inválida.'
        });
    }

    const mensagem = erro instanceof ErroHttp ? erro.message : 'Não foi possível concluir esta solicitação.';
    if (status === 404) return paginaNaoEncontrada(req, res);
    res.status(status).render('erro', { status, mensagem });
}

module.exports = { ErroHttp, paginaNaoEncontrada, tratarErro };
