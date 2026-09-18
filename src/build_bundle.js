/**
 * OpenDTP - Micro-Bundler
 * 
 * Empacota os módulos do src/core em um único arquivo UMD auto-contido
 * para o navegador (src/ui/opendtp.bundle.js), eliminando colisões de escopo global
 * e garantindo execução determinística tanto em file:/// quanto em HTTP e Tauri.
 */

const fs = require('fs');
const path = require('path');

const CORE_FILES = [
  { id: './units', path: 'src/core/units.js' },
  { id: './schema', path: 'src/core/schema.js' },
  { id: './styles', path: 'src/core/styles.js' },
  { id: './hyphenator', path: 'src/core/hyphenator.js' },
  { id: './spatial', path: 'src/core/spatial.js' },
  { id: './slicer', path: 'src/core/slicer.js' },
  { id: './pdf', path: 'src/core/pdf.js' },
  { id: './document', path: 'src/core/document.js' },
  { id: './commands', path: 'src/core/commands.js' },
  { id: './engine', path: 'src/core/engine.js' },
  { id: './index', path: 'src/core/index.js' }
];

let bundle = `/**
 * OpenDTP - Core Engine Client Bundle
 * Gerado automaticamente para execução limpa no browser e desktop
 */
(function(global) {
  const modules = {};
  const cache = {};

  function define(id, factory) {
    modules[id] = factory;
  }

  function requireModule(id) {
    // Normalizar id relativo
    const cleanId = id.replace(/\\.js$/, '');
    if (cache[cleanId]) return cache[cleanId];
    if (!modules[cleanId]) {
      throw new Error('Módulo não encontrado no bundle: ' + id);
    }
    const module = { exports: {} };
    modules[cleanId](module, module.exports, requireModule);
    cache[cleanId] = module.exports;
    return cache[cleanId];
  }

`;

for (const f of CORE_FILES) {
  const fullPath = path.resolve(__dirname, '..', f.path);
  const code = fs.readFileSync(fullPath, 'utf-8');
  bundle += `  // Module: ${f.id}\n`;
  bundle += `  define('${f.id}', function(module, exports, require) {\n`;
  bundle += code + '\n';
  bundle += `  });\n\n`;
}

bundle += `
  // Inicializar e expor namespaces globais para o navegador
  const OpenDTPCore = requireModule('./index');
  global.OpenDTP = OpenDTPCore;
  global.OpenDTPUnits = requireModule('./units');
  global.OpenDTPSchema = requireModule('./schema');
  global.OpenDTPStyles = requireModule('./styles');
  global.OpenDTPHyphenator = requireModule('./hyphenator');
  global.OpenDTPSpatial = requireModule('./spatial');
  global.OpenDTPSlicer = requireModule('./slicer');
  global.OpenDTPPdf = requireModule('./pdf');
  global.OpenDTPDocument = requireModule('./document');
  global.OpenDTPCommands = requireModule('./commands');
  global.OpenDTPEngine = requireModule('./engine');

})(typeof window !== 'undefined' ? window : globalThis);
`;

const outputPath = path.resolve(__dirname, '..', 'src/ui/opendtp.bundle.js');
fs.writeFileSync(outputPath, bundle, 'utf-8');
console.log('✅ Bundle gerado com sucesso em:', outputPath);
console.log('📦 Tamanho do bundle:', (bundle.length / 1024).toFixed(1), 'KB');
