const { DataTypes } = require('sequelize');
const banco = require('../config/banco');
const Administrador = require('./Administrador');
const { limites } = require('../config/municipio');

const tiposLocal = {
    terreno_baldio: 'Terreno baldio',
    imovel: 'Imóvel',
    via_publica: 'Via pública',
    outro: 'Outro'
};

const situacoes = {
    pendente: 'Pendentes',
    aprovado: 'Aprovados',
    rejeitado: 'Rejeitados',
    resolvido: 'Resolvidos'
};

const Foco = banco.define('Foco', {
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: { min: limites.latitudeMinima, max: limites.latitudeMaxima }
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: { min: limites.longitudeMinima, max: limites.longitudeMaxima }
    },
    descricao: { type: DataTypes.STRING(300), allowNull: false, validate: { len: [10, 300] } },
    tipoLocal: { type: DataTypes.ENUM(...Object.keys(tiposLocal)), allowNull: false },
    // A foto (WebP já recompactado) fica no próprio banco, em uma coluna binária
    // (BYTEA no PostgreSQL). Assim ela não depende do disco do servidor, que é
    // apagado a cada reinício em hospedagens gratuitas.
    foto: { type: DataTypes.BLOB },
    contato: { type: DataTypes.STRING(150) },
    status: { type: DataTypes.ENUM(...Object.keys(situacoes)), allowNull: false, defaultValue: 'pendente' },
    motivoRejeicao: { type: DataTypes.STRING(300) },
    moderadoPor: { type: DataTypes.INTEGER, references: { model: Administrador, key: 'id' }, onDelete: 'SET NULL' },
    moderadoEm: { type: DataTypes.DATE }
}, {
    tableName: 'focos',
    indexes: [{ fields: ['status', 'createdAt'] }],
    // Por padrão as consultas não trazem a foto, para listar focos sem carregar
    // imagens na memória. Quem precisa dela usa Foco.unscoped().
    defaultScope: { attributes: { exclude: ['foto'] } }
});

module.exports = { Foco, tiposLocal, situacoes };
