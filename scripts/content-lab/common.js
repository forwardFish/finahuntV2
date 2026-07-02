const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.join(__dirname, '../..');
const sourceRoot = path.join(root, 'data/content-lab/sources');
const docsRoot = path.join(root, 'docs/content-lab');

function loadDotEnv(file = path.join(root, '.env')) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

loadDotEnv();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  args.date = args.date || new Date().toISOString().slice(0, 10);
  return args;
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`);
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function datedOutputDir(date) {
  return path.join(docsRoot, date);
}

function datedSourcePath(date) {
  return path.join(sourceRoot, `${date}.urls.json`);
}

function loadSourceList(date) {
  const file = datedSourcePath(date);
  const items = readJson(file, defaultSourceList());
  if (!Array.isArray(items)) {
    throw new Error(`Source list must be an array: ${file}`);
  }
  return items.map((item, index) => ({
    id: item.id || `source-${String(index + 1).padStart(3, '0')}`,
    url: String(item.url || '').trim(),
    sourceName: item.sourceName || 'unknown source',
    sourceType: item.sourceType || 'public_web',
    note: item.note || '',
    priority: Number(item.priority || index + 1),
  }));
}

function defaultSourceList() {
  return [
    {
      url: 'https://www.jiuyangongshe.com/',
      sourceName: '韭研公社',
      sourceType: 'public_web',
      note: 'Default live topic feed; detail article links are discovered from the public homepage.',
      priority: 1,
    },
    {
      url: 'https://www.cls.cn/telegraph',
      sourceName: '财联社电报',
      sourceType: 'public_web',
      note: 'Default public telegraph feed; keep review status when dynamic rendering blocks extraction.',
      priority: 2,
    },
  ];
}

function loadKnowledgeBase() {
  const db = readJson(path.join(root, 'services/data/seed.json'), {});
  return {
    themes: Array.isArray(db.themes) ? db.themes : [],
    themeChainNodes: Array.isArray(db.themeChainNodes) ? db.themeChainNodes : [],
    themeChainEdges: Array.isArray(db.themeChainEdges) ? db.themeChainEdges : [],
    companies: Array.isArray(db.companies) ? db.companies : [],
    themeCompanyMatches: Array.isArray(db.themeCompanyMatches) ? db.themeCompanyMatches : [],
    evidences: Array.isArray(db.evidences) ? db.evidences : [],
  };
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function snippet(text, length = 180) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, length);
}

function clampNumber(value, min = 0, max = 100) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function getDeepSeekConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_COMPATIBLE_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_COMPATIBLE_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || process.env.OPENAI_COMPATIBLE_MODEL || 'deepseek-chat',
  };
}

module.exports = {
  root,
  sourceRoot,
  docsRoot,
  ensureDir,
  parseArgs,
  readJson,
  writeJson,
  writeText,
  hash,
  datedOutputDir,
  datedSourcePath,
  defaultSourceList,
  loadSourceList,
  loadKnowledgeBase,
  isValidUrl,
  snippet,
  clampNumber,
  getDeepSeekConfig,
};
