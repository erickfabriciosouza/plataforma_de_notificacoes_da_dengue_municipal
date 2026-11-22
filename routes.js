const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const home = require('./src/controllers/homeController');
const painel = require('./src/controllers/painelController');
const foco = require('./src/controllers/focoController');
const login = require('./src/controllers/loginController');
const admin = require('./src/controllers/adminController');
const { exigirAdministrador } = require('./src/middlewares/autenticacao');
const { fornecerToken, validarToken } = require('./src/middlewares/csrf');
const { ErroHttp } = require('./src/middlewares/erros');

const rotas = Router();
const limitarEnvios = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => next(new ErroHttp(429, 'Foram feitas muitas tentativas de envio. Aguarde 15 minutos e tente novamente.'))
});
const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => next(new ErroHttp(429, 'Foram feitas muitas tentativas de acesso. Aguarde 15 minutos e tente novamente.'))
});

rotas.get('/', home.index);
rotas.get('/sobre', home.sobre);
rotas.get('/api/indicadores', painel.indicadores);
rotas.get('/mapa', fornecerToken, foco.listar);
rotas.post('/focos', limitarEnvios, fornecerToken, foco.lerFormulario, validarToken, foco.criar);
rotas.get('/login', fornecerToken, login.formulario);
rotas.post('/login', limitarLogin, fornecerToken, validarToken, login.entrar);

rotas.use('/admin', exigirAdministrador);
rotas.get('/admin', fornecerToken, admin.listar);
rotas.get('/admin/focos/:id/foto', admin.foto);
rotas.post('/admin/focos/:id/excluir', validarToken, admin.excluir);
rotas.post('/admin/focos/:id/:acao', validarToken, admin.moderar);
rotas.post('/admin/sair', validarToken, login.sair);

rotas.get('/index.html', (req, res) => res.redirect(301, '/'));
rotas.get('/apoio.html', (req, res) => res.redirect(301, '/mapa'));
rotas.get('/sobre.html', (req, res) => res.redirect(301, '/sobre'));

module.exports = rotas;
