const { geocodigo } = require('../config/ambiente');

exports.index = (req, res) => res.render('index', { geocodigo });
exports.sobre = (req, res) => res.render('sobre');
