const { randomBytes, timingSafeEqual } = require('node:crypto');
const { ErroHttp } = require('./erros');

function fornecerToken(req, res, next) {
    req.session.csrf ||= randomBytes(32).toString('hex');
    res.locals.csrf = req.session.csrf;
    res.set('Cache-Control', 'no-store');
    next();
}

function validarToken(req, res, next) {
    const recebido = req.body?._csrf;
    const esperado = req.session.csrf;
    if (typeof recebido === 'string' && /^[a-f0-9]{64}$/.test(recebido) && esperado &&
        timingSafeEqual(Buffer.from(recebido, 'hex'), Buffer.from(esperado, 'hex'))) {
        return next();
    }

    next(new ErroHttp(403, 'A sessão do formulário expirou ou o código de segurança está ausente. Volte à página, recarregue e tente novamente.'));
}

module.exports = { fornecerToken, validarToken };
