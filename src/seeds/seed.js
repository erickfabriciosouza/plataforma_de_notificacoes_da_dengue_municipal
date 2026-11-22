const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');
const banco = require('../config/banco');
const Administrador = require('../models/Administrador');
const { Foco } = require('../models/Foco');
const focosOriginais = require('./focos-originais.json');

const Importacao = banco.define('Importacao', {
    nome: { type: DataTypes.STRING, primaryKey: true }
}, { tableName: 'importacoes' });

async function popularBanco() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || '';
    const senha = process.env.ADMIN_SENHA || '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        senha.length < 12 || Buffer.byteLength(senha) > 72) {
        throw new Error('Preencha ADMIN_EMAIL e ADMIN_SENHA no .env. A senha deve ter pelo menos 12 caracteres e até 72 bytes.');
    }

    await banco.sync();
    const senhaHash = await bcrypt.hash(senha, 12);
    const resultado = await banco.transaction(async transacao => {
        const [, administradorCriado] = await Administrador.findOrCreate({
            where: { email }, defaults: { senhaHash }, transaction: transacao
        });
        const [, podeImportar] = await Importacao.findOrCreate({
            where: { nome: 'focos-do-projeto-original' }, transaction: transacao
        });

        if (podeImportar) {
            await Foco.bulkCreate(focosOriginais.map(({ lat, lon, descricao }, indice) => ({
                latitude: lat, longitude: lon, descricao,
                tipoLocal: indice === 1 ? 'terreno_baldio' : 'outro', status: 'aprovado'
            })), { validate: true, transaction: transacao });
        }

        return { administradorCriado, podeImportar };
    });

    console.log(resultado.administradorCriado ? 'Administrador criado.' : 'Administrador já cadastrado.');
    console.log(resultado.podeImportar ? 'Dois focos originais importados.' : 'Importação original já realizada.');
}

popularBanco().catch(erro => {
    console.error('Falha ao preparar o banco:', erro.name === 'Error' ? erro.message : erro.name);
    process.exitCode = 1;
}).finally(() => banco.close());
