const sessao = require('express-session');
const ArmazenamentoSequelize = require('connect-session-sequelize')(sessao.Store);
const banco = require('./banco');
const { producao, segredoSessao } = require('./ambiente');

const nomeCookie = 'painel.sid';
const duracao = 8 * 60 * 60 * 1000;
const opcoesCookie = { httpOnly: true, sameSite: 'lax', secure: producao, path: '/' };

function configurarSessao() {
    if (segredoSessao.length < 32) {
        throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres no arquivo .env.');
    }

    const armazenamento = new ArmazenamentoSequelize({ db: banco, expiration: duracao });
    const middleware = sessao({
        name: nomeCookie,
        secret: segredoSessao,
        store: armazenamento,
        resave: false,
        saveUninitialized: false,
        cookie: { ...opcoesCookie, maxAge: duracao }
    });

    return { armazenamento, middleware };
}

module.exports = { configurarSessao, nomeCookie, opcoesCookie };
