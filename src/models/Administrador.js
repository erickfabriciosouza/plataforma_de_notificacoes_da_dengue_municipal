const { DataTypes } = require('sequelize');
const banco = require('../config/banco');

module.exports = banco.define('Administrador', {
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true, validate: { isEmail: true } },
    senhaHash: { type: DataTypes.STRING(60), allowNull: false }
}, { tableName: 'administradores' });
