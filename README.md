DENGUE SANTO AMARO
Painel epidemiológico e mapa comunitário de Santo Amaro (BA)

O painel reúne dados epidemiológicos e climáticos do InfoDengue para facilitar
a consulta sobre a dengue no município. O mapa permite que moradores indiquem
possíveis focos diretamente no navegador. Uma equipe revisa os registros antes
da publicação.

FUNCIONALIDADES

- Painel com dados da semana mais recente publicada, das últimas quatro semanas,
  do ano vigente e da série histórica a partir de 2010.
- Indicadores de casos notificados e estimados, nível de alerta, ritmo de
  transmissão (Rt) e incidência por 100 mil habitantes.
- Gráficos de casos e clima com tabela de valores. As séries da semana atual e
  das últimas quatro semanas mostram até 12 e 24 semanas, respectivamente.
- Mapa de focos aprovados com lista interativa, seleção de ponto no mapa,
  geolocalização, marcador arrastável e opção de preencher coordenadas.
- Envio de um relato com descrição, tipo de local e, se desejado, foto e contato.
  A equipe de moderação pode consultar a foto e o contato na área administrativa.
- Moderação com contadores de pendentes, aprovados, rejeitados e resolvidos.
  O administrador pode aprovar, rejeitar, marcar como resolvido ou excluir.
- Página Sobre com o texto e a foto do autor. E-mail público e WhatsApp são
  exibidos quando configurados.

TECNOLOGIAS

Node.js 24 LTS, Express 5, EJS, Sequelize, SQLite (local) e PostgreSQL
(produção). A sessão usa express-session com armazenamento via
connect-session-sequelize. As senhas recebem hash com bcryptjs. A aplicação
usa Helmet, tokens CSRF vinculados à sessão, express-rate-limit, Multer, Sharp,
connect-flash e dotenv. A interface usa CSS, Inter, JavaScript puro, Chart.js,
Leaflet e OpenStreetMap.

ARQUITETURA MVC

As rotas encaminham cada requisição a um controlador. O controlador combina
os dados dos modelos Sequelize ou do serviço InfoDengue e os envia à view
EJS, que renderiza o HTML. A rota de indicadores responde em JSON para o
JavaScript que atualiza o painel. O navegador consulta essa rota no mesmo
servidor da aplicação.

.
├── server.js                    Configura o Express e inicia o servidor
├── routes.js                    Define as rotas e os middlewares de cada fluxo
├── .env.example                 Modelo de configuração
├── .gitignore                   Exclui dados e configurações locais
├── package.json                 Scripts e dependências
├── package-lock.json            Versões reproduzíveis das dependências
├── README.txt
├── src/
│   ├── config/                  Ambiente, banco, sessão, upload e limites
│   ├── controllers/             Páginas, indicadores, focos, login e moderação
│   ├── middlewares/             Autenticação, CSRF, variáveis das views e erros
│   ├── models/                  Foco e Administrador
│   ├── services/                Consulta, cache e agregação do InfoDengue
│   ├── seeds/                   Criação do administrador e importação inicial
│   └── views/                   Páginas EJS, partials e moderação
└── public/
    ├── css/                     Estilos e regras de responsividade
    ├── js/                      Painel, mapa e navegação
    └── img/                     Foto do autor e ícone do site

A pasta dados/ (banco SQLite local) é criada sob demanda. As três páginas do
projeto anterior redirecionam para as rotas novas.

FLUXO DE MODERAÇÃO

1. O cidadão marca o local, descreve o foco e envia o formulário.
2. O banco grava o registro como pendente. A lista e o mapa públicos filtram
   por aprovado.
3. O administrador entra em /login e revisa o ponto, o relato e a foto.
4. Ao aprovar, o foco aparece no mapa e na lista. Ao rejeitar, o registro
   permanece no histórico de rejeitados, com motivo opcional.
5. Ao marcar um foco aprovado como resolvido, ele sai do mapa e continua no
   histórico de resolvidos. A exclusão remove o registro e, junto, a foto.

O retângulo em src/config/municipio.js aproxima a extensão da malha do IBGE.
Pontos dentro desse retângulo passam pela validação geográfica, inclusive nos
trechos que o retângulo cobre além do limite municipal. A triagem revisa esses
casos com as demais informações do relato.

COMO RODAR LOCALMENTE

1. Instale o Node.js 24 LTS (24.5 ou mais recente da linha 24) e abra o terminal
   na pasta que contém package.json. O SQLite vem como dependência do npm e
   funciona sem instalar ou iniciar um servidor de banco.

2. Instale as dependências e crie a configuração local.

   npm install
   cp .env.example .env

   No PowerShell, use Copy-Item .env.example .env no lugar de cp.

3. Gere um segredo de sessão e cole a saída ao lado de SESSION_SECRET no .env.

   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

   Preencha ADMIN_EMAIL e ADMIN_SENHA com suas credenciais. A senha deve ter
   pelo menos 12 caracteres e no máximo 72 bytes em UTF-8. Use aspas no .env
   se um valor contiver um caractere como #. Em desenvolvimento, mantenha
   DATABASE_URL vazio para usar o arquivo dados/painel.sqlite.

4. Execute o seed e inicie o servidor.

   npm run seed
   npm run dev

   O seed importa os dois focos originais como aprovados. Ele registra a
   importação no banco para que uma nova execução preserve o histórico,
   inclusive exclusões. Se o e-mail já existir, a senha atual é preservada.

5. Abra http://localhost:3000 para o painel e http://localhost:3000/login
   para entrar na área administrativa. Se você alterar PORT, use a porta
   configurada. Consulte o mapa em /mapa e a página do autor em /sobre.

   As consultas ao InfoDengue e as imagens do mapa requerem internet.
   A geolocalização funciona em localhost e em sites com HTTPS, mediante
   permissão do navegador. A seleção manual do ponto também está disponível.
   Use npm start para rodar sem o recarregamento do Nodemon.

VARIÁVEIS DE AMBIENTE

PORT                 Porta HTTP, 3000 por padrão.
NODE_ENV             development para o ambiente local. production na hospedagem.
DATABASE_URL         URL do PostgreSQL. Vazia em desenvolvimento, usa SQLite.
SESSION_SECRET       Segredo aleatório com pelo menos 32 caracteres. Ao trocá-lo,
                     as sessões atuais precisam de um novo login.
ADMIN_EMAIL          E-mail do administrador a ser criado pelo seed.
ADMIN_SENHA          Senha usada somente pelo seed para gerar o hash bcrypt.
CONTATO_EMAIL        E-mail público opcional, exibido no rodapé.
CONTATO_WHATSAPP     Número público opcional, com DDI, DDD e número.
GEOCODE_MUNICIPIO    Código IBGE consultado no InfoDengue. Padrão 2928604.
TRUST_PROXY          Quantidade de proxies confiáveis à frente do Express.
                     Padrão 0 local e 1 em produção. Confira a topologia da
                     hospedagem para identificar corretamente o IP e o HTTPS.

PUBLICAÇÃO COM RENDER OU RAILWAY E POSTGRESQL NO NEON

1. Envie o conteúdo desta pasta para o seu repositório GitHub. O .gitignore
   exclui .env, banco SQLite e node_modules.
2. Crie um banco no Neon e copie a URL do PostgreSQL com sslmode=require.
3. Crie um serviço Node.js ligado ao repositório. Selecione Node.js 24 LTS,
   use npm ci como comando de instalação/build e npm start para iniciar.
4. Configure NODE_ENV=production, DATABASE_URL, SESSION_SECRET e os contatos
   públicos desejados nas variáveis do serviço. A plataforma pode fornecer
   PORT. Sirva a aplicação por HTTPS, que o cookie administrativo requer.
5. Rode npm run seed uma vez com as credenciais do administrador e com a URL
   desse mesmo banco. Você pode usar o terminal da hospedagem, se disponível,
   ou rodar localmente após configurar temporariamente DATABASE_URL e
   NODE_ENV=production no .env local. Depois, restaure o .env de desenvolvimento.
   A aplicação em execução usa bcrypt e dispensa ADMIN_SENHA e ADMIN_EMAIL
   após a criação do administrador. Abra /login para verificar o acesso.

Os registros, as fotos, as informações de moderação e as sessões ficam todos
no PostgreSQL externo. Nada que precise durar é gravado no disco do servidor,
então a aplicação funciona em hospedagens com disco temporário, que apagam os
arquivos locais a cada reinício, hibernação ou novo deploy.

DECISÕES TÉCNICAS

- A consulta ao InfoDengue sai do servidor e elimina o intermediário CORS.
  O cache em memória dura seis horas para a consulta recente e 24 horas
  para a histórica. Os recortes recentes compartilham a consulta, que inclui
  o ano anterior para manter o intervalo de 12 ou 24 semanas na virada.
  O painel informa quando o servidor consultou a fonte e o intervalo de SE
  publicado. O ano vigente é calculado no horário da Bahia.
- Os dados são ordenados por SE (ano e semana epidemiológica). Os cálculos
  usam somente os valores presentes, preservando zeros reais. A incidência e
  os casos são somados. O alerta é o maior nível no período e o Rt usa a
  média das semanas com valor. A classificação de Rt segue o valor exibido a
  duas casas decimais, como no painel anterior. Um conjunto sem valor resulta
  em um traço. No histórico, os casos estimados são somados por ano e o clima
  é calculado pela média das semanas disponíveis de cada ano.
- O gráfico de casos usa barras e o de clima usa duas linhas, com °C à
  esquerda e % à direita. Separar os painéis reduz a disputa por espaço entre
  três unidades e facilita a leitura no celular. Campos ausentes deixam
  lacunas. Ao trocar de recorte, os gráficos anteriores são destruídos.
- Sequelize usa os mesmos modelos para SQLite e PostgreSQL, mantendo o
  ambiente local simples. O processo cria as tabelas iniciais e as sessões
  persistem no banco. Evoluções de esquema em produção podem usar migrações
  explícitas.
- Formulários usam CSRF, validação no servidor e sessões com cookie HttpOnly.
  Relatos e motivos são escapados pelo EJS e popups usam textContent. A
  aplicação valida e recompacta fotos para WebP, remove os metadados e limita
  o upload a 5 MB.
- As fotos ficam no próprio banco, na coluna foto da tabela focos (tipo BYTEA
  no PostgreSQL), e não em uma pasta do servidor. Hospedagens gratuitas apagam
  o disco a cada reinício; com a foto na mesma linha do foco, os dois nunca se
  separam e a exclusão remove ambos de uma vez. Como cada imagem é reduzida
  para no máximo 1600 px em WebP, o volume cabe com folga no plano gratuito do
  Neon. As listagens não carregam a coluna foto (escopo padrão do model), e a
  imagem só é lida na rota autenticada /admin/focos/:id/foto. As bibliotecas da interface são servidas pelo próprio
  Express. A política CSP permite as imagens do servidor de mapas do
  OpenStreetMap e restringe scripts e estilos à origem da aplicação.

FONTES E LICENÇAS

InfoDengue, painel municipal e fonte dos dados epidemiológicos e climáticos.
https://info.dengue.mat.br/alerta/2928604/dengue

InfoDengue, documentação e endpoint da API pública.
https://info.dengue.mat.br/services/api
https://info.dengue.mat.br/api/alertcity

OpenStreetMap, dados cartográficos sob Open Database License (ODbL), com
atribuição a © OpenStreetMap contributors. As imagens do mapa seguem a
política de uso do servidor de tiles.
https://www.openstreetmap.org/copyright
https://operations.osmfoundation.org/policies/tiles/

IBGE, malha municipal usada como referência para o retângulo de Santo Amaro.
https://servicodados.ibge.gov.br/api/v3/malhas/municipios/2928604?formato=application/vnd.geo+json&qualidade=intermediaria

MELHORIAS FUTURAS

- Usar o polígono da malha municipal para validar os pontos perto da divisa.
- Mover as fotos para um serviço de armazenamento de objetos (como S3) se o
  volume crescer muito, e automatizar backups.
- Adotar migrações versionadas e adicionar paginação na moderação.
- Oferecer exportação dos indicadores e dos focos públicos.
- Compartilhar o cache e os limites de requisição entre réplicas se o
  serviço passar a operar em múltiplas instâncias.

Autor: Erick Fabrício Souza dos Santos
