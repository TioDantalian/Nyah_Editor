/**
 * OpenDTP - Local Zero-Dependency Dev & Studio Server
 * 
 * Servidor HTTP nativo em Node.js (sem dependências externas)
 * para servir a aplicação do estúdio, assets e amostras.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.md': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Normalizar rota inicial
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/' || reqUrl === '/studio') {
    reqUrl = '/src/ui/app.html';
  }

  const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>404 — Arquivo não encontrado</h1><p>${reqUrl}</p>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/src/ui/app.html`;
  console.log('=============================================================');
  console.log('🚀 SERVIDOR OPENDTP STUDIO EM EXECUÇÃO');
  console.log('=============================================================');
  console.log(`🌐 Acesso Web: ${url}`);
  console.log('=============================================================');

  // Abrir automaticamente no navegador padrão se passado flag --open
  if (process.argv.includes('--open')) {
    const startCmd = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
    exec(startCmd, (err) => {
      if (err) console.error('Erro ao abrir navegador automaticamente:', err.message);
    });
  }
});
