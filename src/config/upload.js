const multer = require('multer');
const sharp = require('sharp');

const receberFoto = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 6, fieldSize: 4096, parts: 8 }
}).single('foto');

async function prepararFoto({ buffer }) {
    const imagem = sharp(buffer, { limitInputPixels: 50_000_000 });
    const { format } = await imagem.metadata();
    if (!['jpeg', 'png', 'webp'].includes(format)) {
        throw new Error('Formato inválido');
    }

    // A recompactação remove os metadados originais, inclusive as coordenadas EXIF.
    return imagem.rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp().toBuffer();
}

module.exports = { receberFoto, prepararFoto };
