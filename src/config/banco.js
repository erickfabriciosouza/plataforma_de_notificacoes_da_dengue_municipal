const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { Sequelize } = require('sequelize');
const { urlBanco, producao } = require('./ambiente');

function conectarBanco() {
    if (urlBanco) {
        if (!/^postgres(?:ql)?:\/\//.test(urlBanco)) {
            throw new Error('DATABASE_URL deve apontar para um banco PostgreSQL.');
        }
        return new Sequelize(urlBanco, { dialect: 'postgres', logging: false });
    }

    if (producao) {
        throw new Error('Configure DATABASE_URL com PostgreSQL para usar o modo de produção.');
    }

    const pasta = path.join(__dirname, '../../dados');
    mkdirSync(pasta, { recursive: true });
    return new Sequelize({
        dialect: 'sqlite',
        storage: path.join(pasta, 'painel.sqlite'),
        logging: false
    });
}

module.exports = conectarBanco();
