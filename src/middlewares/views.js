const { contatoEmail, contatoWhatsapp } = require('../config/ambiente');

module.exports = function prepararViews(req, res, next) {
    res.locals.caminho = req.path;
    res.locals.administradorLogado = Boolean(req.session.administradorId);
    res.locals.contatoEmail = contatoEmail;
    res.locals.contatoWhatsapp = contatoWhatsapp;
    res.locals.sucessos = req.session.flash?.sucesso ? req.flash('sucesso') : [];
    res.locals.erros = req.session.flash?.erro ? req.flash('erro') : [];
    next();
};
