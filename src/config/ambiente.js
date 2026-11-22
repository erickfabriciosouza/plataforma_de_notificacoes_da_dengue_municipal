require('dotenv').config({ quiet: true });

const producao = process.env.NODE_ENV === 'production';
const geocodigo = process.env.GEOCODE_MUNICIPIO || '2928604';
const contatoEmail = (process.env.CONTATO_EMAIL || '').trim();
const contatoWhatsapp = (process.env.CONTATO_WHATSAPP || '').replace(/\D/g, '');

if (!/^\d{7}$/.test(geocodigo)) {
    throw new Error('GEOCODE_MUNICIPIO deve ter sete dígitos.');
}

module.exports = {
    producao,
    geocodigo,
    porta: Number(process.env.PORT || 3000),
    urlBanco: process.env.DATABASE_URL,
    segredoSessao: process.env.SESSION_SECRET || '',
    proxiesConfiaveis: Number(process.env.TRUST_PROXY ?? (producao ? 1 : 0)),
    contatoEmail: /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(contatoEmail) ? contatoEmail : '',
    contatoWhatsapp: /^\d{10,15}$/.test(contatoWhatsapp) ? contatoWhatsapp : ''
};
