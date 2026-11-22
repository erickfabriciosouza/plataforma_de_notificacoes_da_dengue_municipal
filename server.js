const express = require('express');
const helmet = require('helmet');
const flash = require('connect-flash');
const path = require('node:path');
const { porta, producao, proxiesConfiaveis } = require('./src/config/ambiente');
const banco = require('./src/config/banco');
const { configurarSessao } = require('./src/config/sessao');
const prepararViews = require('./src/middlewares/views');
const { paginaNaoEncontrada, tratarErro } = require('./src/middlewares/erros');
const rotas = require('./routes');

async function iniciar() {
    const app = express();
    if (!Number.isInteger(proxiesConfiaveis) || proxiesConfiaveis < 0) {
        throw new Error('TRUST_PROXY deve ser um número inteiro igual ou maior que zero.');
    }

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'src/views'));
    app.set('trust proxy', proxiesConfiaveis || false);
    Object.assign(app.locals, {
        caminho: '', administradorLogado: false, contatoEmail: '', contatoWhatsapp: '', sucessos: [], erros: []
    });

    app.use(helmet({
        strictTransportSecurity: producao ? undefined : false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'"],
                styleSrcAttr: ["'none'"],
                imgSrc: ["'self'", 'data:', 'https://tile.openstreetmap.org'],
                connectSrc: ["'self'"],
                upgradeInsecureRequests: producao ? [] : null
            }
        }
    }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/bibliotecas/leaflet', express.static(path.join(__dirname, 'node_modules/leaflet/dist')));
    app.use('/bibliotecas/inter', express.static(path.join(__dirname, 'node_modules/@fontsource/inter/files')));
    app.get('/bibliotecas/chart.js', (req, res) => {
        res.sendFile(path.join(__dirname, 'node_modules/chart.js/dist/chart.umd.min.js'));
    });

    const { armazenamento, middleware } = configurarSessao();
    app.use(express.urlencoded({ extended: false, limit: '20kb', parameterLimit: 20 }));
    app.use(middleware, flash(), prepararViews);
    app.use(rotas);
    app.use(paginaNaoEncontrada);
    app.use(tratarErro);

    await banco.sync();
    await armazenamento.sync();
    const servidor = app.listen(porta, () => console.log(`Painel disponível em http://localhost:${porta}`));
        function encerrar() {
        armazenamento.stopExpiringSessions();
        servidor.close(() => banco.close().catch(() => { process.exitCode = 1; }));
    }
    process.once('SIGTERM', encerrar);
    process.once('SIGINT', encerrar);
}

iniciar().catch(erro => {
    console.error('Falha ao iniciar o painel:', erro.name, erro.name === 'Error' ? erro.message : erro.original?.code || '');
    process.exit(1);
});
