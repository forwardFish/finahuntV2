const fs = require('node:fs');
const path = require('node:path');

const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';
const TEXT_FIELD = 1;
const NUMBER_FIELD = 2;

function loadDotEnv(file = path.join(process.cwd(), '.env'), overwrite = false) {
  const values = {};
  if (!fs.existsSync(file)) return values;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim().replace(/^["']|["']$/g, '');
    values[key] = value;
    if (overwrite || !process.env[key]) process.env[key] = value;
  }
  return values;
}

function chunks(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function scalar(value) {
  if (Array.isArray(value)) return value.map(scalar).filter(Boolean).join('');
  if (value && typeof value === 'object') {
    if (value.text) return String(value.text);
    if (value.name) return String(value.name);
    if (value.value) return String(value.value);
  }
  return value == null ? '' : String(value);
}

class FeishuBitableClient {
  constructor(options = {}) {
    const envFile = loadDotEnv(options.envPath, Boolean(options.envPath));
    this.appId = options.appId || envFile.FINAHUNT_FEISHU_APP_ID || envFile.FEISHU_APP_ID || envFile.APP_ID || process.env.FINAHUNT_FEISHU_APP_ID || process.env.FEISHU_APP_ID || process.env.APP_ID || '';
    this.appSecret = options.appSecret || envFile.FINAHUNT_FEISHU_APP_SECRET || envFile.FEISHU_APP_SECRET || envFile.APP_SECRET || process.env.FINAHUNT_FEISHU_APP_SECRET || process.env.FEISHU_APP_SECRET || process.env.APP_SECRET || '';
    this.appToken = options.appToken || envFile.FINAHUNT_FEISHU_APP_TOKEN || envFile.FEISHU_APP_TOKEN || envFile.APP_TOKEN || process.env.FINAHUNT_FEISHU_APP_TOKEN || process.env.FEISHU_APP_TOKEN || process.env.APP_TOKEN || '';
    this.tableId = options.tableId || process.env.FINAHUNT_FEISHU_TABLE_ID || '';
    this.baseUrl = (options.baseUrl || FEISHU_BASE_URL).replace(/\/$/, '');
    this.tenantToken = '';
    if (!this.appId) throw new Error('Missing FINAHUNT_FEISHU_APP_ID, FEISHU_APP_ID, or APP_ID');
    if (!this.appSecret) throw new Error('Missing FINAHUNT_FEISHU_APP_SECRET, FEISHU_APP_SECRET, or APP_SECRET');
    if (!this.appToken) throw new Error('Missing FINAHUNT_FEISHU_APP_TOKEN, FEISHU_APP_TOKEN, or APP_TOKEN');
    if (!this.tableId) throw new Error('Missing FINAHUNT_FEISHU_TABLE_ID');
  }

  async request(method, apiPath, body, params = {}) {
    const url = new URL(`${this.baseUrl}${apiPath}`);
    for (const [key, value] of Object.entries(params || {})) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    }
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (!apiPath.includes('/auth/v3/tenant_access_token')) headers.Authorization = `Bearer ${await this.getTenantToken()}`;
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Feishu API returned non-JSON HTTP ${response.status}: ${text.slice(0, 300)}`);
    }
    if (response.status >= 400 || parsed.code !== 0) {
      throw new Error(`Feishu API ${method} ${apiPath} failed HTTP ${response.status}: ${JSON.stringify(parsed).slice(0, 800)}`);
    }
    return parsed.data || parsed;
  }

  async getTenantToken() {
    if (this.tenantToken) return this.tenantToken;
    const data = await this.request('POST', '/auth/v3/tenant_access_token/internal', {
      app_id: this.appId,
      app_secret: this.appSecret,
    });
    this.tenantToken = String(data.tenant_access_token || '');
    if (!this.tenantToken) throw new Error('Feishu tenant token response did not include tenant_access_token');
    return this.tenantToken;
  }

  async listFields() {
    const fields = [];
    let pageToken = '';
    do {
      const data = await this.request(
        'GET',
        `/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/fields`,
        null,
        { page_size: '100', page_token: pageToken },
      );
      fields.push(...(data.items || []));
      pageToken = data.has_more ? data.page_token || '' : '';
    } while (pageToken);
    return fields;
  }

  async ensureFields(fieldSpecs) {
    const existing = new Map((await this.listFields()).map((field) => [String(field.field_name), field]));
    const created = [];
    for (const spec of fieldSpecs) {
      if (existing.has(spec.field_name)) continue;
      const data = await this.request('POST', `/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/fields`, spec);
      created.push(spec.field_name);
      const field = data.field || data;
      existing.set(spec.field_name, field);
    }
    return { fields: existing, created };
  }

  async listRecords(fieldNames = []) {
    const records = [];
    let pageToken = '';
    const params = { page_size: '500' };
    if (fieldNames.length) params.field_names = JSON.stringify(fieldNames);
    do {
      const data = await this.request(
        'GET',
        `/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records`,
        null,
        { ...params, page_token: pageToken },
      );
      records.push(...(data.items || []));
      pageToken = data.has_more ? data.page_token || '' : '';
    } while (pageToken);
    return records;
  }

  async upsertRows(rows, uniqueFieldName) {
    const existingRecords = await this.listRecords([uniqueFieldName]);
    const byKey = new Map();
    for (const record of existingRecords) {
      const key = scalar((record.fields || {})[uniqueFieldName]);
      if (key) byKey.set(key, record.record_id);
    }
    const toCreate = [];
    const toUpdate = [];
    for (const row of rows) {
      const key = scalar(row[uniqueFieldName]);
      if (!key) throw new Error(`Row missing unique field ${uniqueFieldName}`);
      const recordId = byKey.get(key);
      if (recordId) toUpdate.push({ record_id: recordId, fields: row });
      else toCreate.push({ fields: row });
    }
    for (const group of chunks(toCreate, 500)) {
      await this.request('POST', `/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records/batch_create`, { records: group });
    }
    for (const group of chunks(toUpdate, 500)) {
      await this.request('POST', `/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records/batch_update`, { records: group });
    }
    return { created: toCreate.length, updated: toUpdate.length };
  }

  async upsertJsonRows(rows, textFieldName, uniqueFieldName) {
    const existingRecords = await this.listRecords([textFieldName]);
    const byKey = new Map();
    for (const record of existingRecords) {
      const raw = scalar((record.fields || {})[textFieldName]);
      try {
        const parsed = JSON.parse(raw);
        const key = scalar(parsed[uniqueFieldName]);
        if (key) byKey.set(key, record.record_id);
      } catch {
        // Existing non-JSON rows are user data; leave them untouched.
      }
    }
    const toCreate = [];
    const toUpdate = [];
    for (const row of rows) {
      const key = scalar(row[uniqueFieldName]);
      if (!key) throw new Error(`JSON row missing unique field ${uniqueFieldName}`);
      const fields = { [textFieldName]: JSON.stringify(row) };
      const recordId = byKey.get(key);
      if (recordId) toUpdate.push({ record_id: recordId, fields });
      else toCreate.push({ fields });
    }
    for (const group of chunks(toCreate, 500)) {
      await this.request('POST', `/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records/batch_create`, { records: group });
    }
    for (const group of chunks(toUpdate, 500)) {
      await this.request('POST', `/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records/batch_update`, { records: group });
    }
    return { created: toCreate.length, updated: toUpdate.length, mode: 'single_text_json', textFieldName };
  }

  async readbackByKeys(uniqueFieldName, keys) {
    const records = await this.listRecords();
    const wanted = new Set(keys.map(String));
    const found = {};
    for (const record of records) {
      const fields = record.fields || {};
      const key = scalar(fields[uniqueFieldName]);
      if (wanted.has(key)) found[key] = fields;
    }
    return found;
  }

  async readbackJsonByKeys(textFieldName, uniqueFieldName, keys) {
    const records = await this.listRecords([textFieldName]);
    const wanted = new Set(keys.map(String));
    const found = {};
    for (const record of records) {
      const raw = scalar((record.fields || {})[textFieldName]);
      try {
        const parsed = JSON.parse(raw);
        const key = scalar(parsed[uniqueFieldName]);
        if (wanted.has(key)) found[key] = parsed;
      } catch {
        // Ignore non-JSON rows in fallback mode.
      }
    }
    return found;
  }
}

function stockAnalysisFieldSpecs() {
  return [
    { field_name: '唯一键', type: TEXT_FIELD },
    { field_name: '来源链接', type: TEXT_FIELD },
    { field_name: '文章标题', type: TEXT_FIELD },
    { field_name: '发布时间', type: TEXT_FIELD },
    { field_name: '抓取时间', type: TEXT_FIELD },
    { field_name: '板块主题', type: TEXT_FIELD },
    { field_name: '股票代码', type: TEXT_FIELD },
    { field_name: '股票名称', type: TEXT_FIELD },
    { field_name: '相关股票', type: TEXT_FIELD },
    { field_name: '当前情况', type: TEXT_FIELD },
    { field_name: '未来预期', type: TEXT_FIELD },
    { field_name: '未来涨幅推演', type: TEXT_FIELD },
    { field_name: '可能催化', type: TEXT_FIELD },
    { field_name: '预期差评分', type: NUMBER_FIELD },
    { field_name: '置信度', type: TEXT_FIELD },
    { field_name: '风险点', type: TEXT_FIELD },
    { field_name: '证据摘录', type: TEXT_FIELD },
    { field_name: '分析状态', type: TEXT_FIELD },
    { field_name: '合规提示', type: TEXT_FIELD },
  ];
}

function stockAnalysisFieldSpecs() {
  const text = (field_name) => ({ field_name, type: TEXT_FIELD });
  const number = (field_name) => ({ field_name, type: NUMBER_FIELD });
  return [
    text('\u552f\u4e00\u952e'),
    text('\u6765\u6e90\u94fe\u63a5'),
    text('\u6587\u7ae0\u6807\u9898'),
    text('\u53d1\u5e03\u65f6\u95f4'),
    text('\u6293\u53d6\u65f6\u95f4'),
    text('\u677f\u5757\u4e3b\u9898'),
    text('\u80a1\u7968\u4ee3\u7801'),
    text('\u80a1\u7968\u540d\u79f0'),
    text('\u76f8\u5173\u80a1\u7968'),
    text('\u5f53\u524d\u60c5\u51b5'),
    text('\u672a\u6765\u9884\u671f'),
    text('\u672a\u6765\u6da8\u5e45\u63a8\u6f14'),
    text('\u53ef\u80fd\u50ac\u5316'),
    number('\u9884\u671f\u5dee\u8bc4\u5206'),
    text('\u7f6e\u4fe1\u5ea6'),
    text('\u98ce\u9669\u70b9'),
    text('\u8bc1\u636e\u6458\u5f55'),
    text('\u5206\u6790\u72b6\u6001'),
    text('\u5408\u89c4\u63d0\u793a'),
    text('\u5206\u6790\u65e5\u671f'),
    text('\u80a1\u7968\u6807\u8bc6'),
    number('\u8bc1\u636e\u6b21\u6570'),
    number('\u8bc1\u636e\u6765\u6e90\u6570'),
    text('\u8bc1\u636eJSON'),
    number('\u5f53\u524d\u5e02\u503c(\u4ebf)'),
    number('\u4e0a\u6b21\u5e02\u503c(\u4ebf)'),
    number('\u5e02\u503c\u53d8\u5316%'),
    text('\u5e02\u503c\u53d8\u5316\u5f71\u54cd'),
    number('\u672a\u6765\u4f30\u503c(\u4ebf)'),
    number('\u4f30\u503c\u7a7a\u95f4\u500d\u6570'),
    number('\u4f30\u503c\u5dee\u989d(\u4ebf)'),
    text('\u672a\u6765\u4f30\u503c\u63a8\u5bfc'),
    text('\u4f30\u503c\u65b9\u6cd5'),
    number('\u4f30\u503c\u7f6e\u4fe1\u5ea6'),
    number('\u4f30\u503c\u7a7a\u95f4\u8bc4\u5206'),
    number('\u8bc1\u636e\u5f3a\u5ea6\u8bc4\u5206'),
    number('\u50ac\u5316\u65f6\u6548\u8bc4\u5206'),
    number('\u4e1a\u7ee9\u4f20\u5bfc\u8bc4\u5206'),
    number('\u98ce\u9669\u6298\u6263\u8bc4\u5206'),
    number('\u7efc\u5408\u8bc4\u5206'),
    number('\u57fa\u7840\u9884\u671f\u5dee\u8bc4\u5206'),
    number('\u52a8\u6001\u9884\u671f\u5dee\u8bc4\u5206'),
    text('\u8bc4\u5206\u8bf4\u660e'),
    text('\u5e02\u503c\u6570\u636e\u72b6\u6001'),
    text('\u5e02\u503c\u6570\u636e\u6765\u6e90'),
  ];
}

module.exports = {
  FeishuBitableClient,
  stockAnalysisFieldSpecs,
  scalar,
};
