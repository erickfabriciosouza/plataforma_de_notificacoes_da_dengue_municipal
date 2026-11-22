function exigirAdministrador(req, res, next) {
    res.set('Cache-Control', 'no-store');
    if (!req.session.administradorId) return res.redirect('/login');
    next();
}

module.exports = { exigirAdministrador };
