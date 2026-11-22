const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const Administrador = require('../models/Administrador');
const { nomeCookie, opcoesCookie } = require('../config/sessao');

const hashDeComparacao = bcrypt.hashSync(randomUUID(), 12);

exports.formulario = (req, res) => {
    if (req.session.administradorId) return res.redirect('/admin');
    res.render('login', { erroLogin: '', email: '' });
};

exports.entrar = async (req, res, next) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const senha = typeof req.body.senha === 'string' ? req.body.senha : '';
    const camposValidos = email.length <= 254 && email.includes('@') && senha && Buffer.byteLength(senha) <= 72;
    const administrador = camposValidos ? await Administrador.findOne({ where: { email } }) : null;
    const senhaValida = await bcrypt.compare(camposValidos ? senha : '', administrador?.senhaHash ?? hashDeComparacao);

    if (!administrador || !senhaValida) {
        return res.status(401).render('login', { erroLogin: 'E-mail ou senha inválidos.', email });
    }

    req.session.regenerate(erro => {
        if (erro) return next(erro);
        req.session.administradorId = administrador.id;
        req.session.save(erroAoSalvar => {
            if (erroAoSalvar) return next(erroAoSalvar);
            res.redirect(303, '/admin');
        });
    });
};

exports.sair = (req, res, next) => {
    req.session.destroy(erro => {
        if (erro) return next(erro);
        res.clearCookie(nomeCookie, opcoesCookie);
        res.redirect(303, '/login');
    });
};
