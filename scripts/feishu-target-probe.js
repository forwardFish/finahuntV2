const path = require('node:path');
const fs = require('node:fs');
const { FeishuBitableClient, stockAnalysisFieldSpecs } = require('../services/feishu/bitable-client');
const { parseFeishuUrl } = require('./jiuyangongshe-to-feishu');

const DEFAULT_FEISHU_URL = 'https://my.feishu.cn/base/CEo9byodzaH5TOsWMMxco1C5nWf?table=tblGxLd1TUJl5269&view=vewpApMVFy';

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
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function captureStep(name, fn) {
  try {
    return { name, status: 'PASS', data: await fn() };
  } catch (error) {
    return {
      name,
      status: 'FAIL',
      error: String(error && error.message ? error.message : error).slice(0, 1000),
    };
  }
}

async function run() {
  const args = parseArgs();
  const feishu = parseFeishuUrl(args.feishu || DEFAULT_FEISHU_URL);
  const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const evidencePath = args.evidence || path.join('docs', 'live-evidence', `feishu-target-probe-${date}.json`);
  let client;
  const authStep = await captureStep('auth_client_init', async () => {
    client = new FeishuBitableClient({ appToken: feishu.appToken, tableId: feishu.tableId, envPath: args['env-path'] });
    await client.getTenantToken();
    return { appToken: feishu.appToken, tableId: feishu.tableId, viewId: feishu.viewId };
  });
  const fieldsStep = authStep.status === 'PASS'
    ? await captureStep('read_fields', async () => client.listFields())
    : { name: 'read_fields', status: 'SKIPPED', error: 'auth failed' };
  const recordsStep = authStep.status === 'PASS'
    ? await captureStep('read_records', async () => {
      const records = await client.listRecords();
      return { count: records.length, sampleRecordIds: records.slice(0, 5).map((record) => record.record_id) };
    })
    : { name: 'read_records', status: 'SKIPPED', error: 'auth failed' };
  const writeProbeStep = authStep.status === 'PASS' && fieldsStep.status === 'PASS'
    ? await captureStep('write_probe_existing_text_field', async () => {
      const textField = fieldsStep.data.find((field) => field.type === 1);
      if (!textField) throw new Error('No existing text field is available for the minimal write probe');
      const payload = { fields: { [String(textField.field_name)]: `write-probe-${new Date().toISOString()}` } };
      return client.request('POST', `/bitable/v1/apps/${client.appToken}/tables/${client.tableId}/records`, payload);
    })
    : { name: 'write_probe_existing_text_field', status: 'SKIPPED', error: 'auth or fields failed' };

  const existingFieldNames = fieldsStep.status === 'PASS'
    ? fieldsStep.data.map((field) => String(field.field_name))
    : [];
  const requiredFieldNames = stockAnalysisFieldSpecs().map((field) => field.field_name);
  const missingRequiredFields = requiredFieldNames.filter((name) => !existingFieldNames.includes(name));
  const evidence = {
    status: authStep.status === 'PASS' && fieldsStep.status === 'PASS' && recordsStep.status === 'PASS'
      ? writeProbeStep.status === 'PASS'
        ? missingRequiredFields.length ? 'WRITABLE_SCHEMA_INCOMPLETE' : 'WRITABLE_SCHEMA_READY'
        : 'READABLE_WRITE_FORBIDDEN'
      : 'PROBE_FAILED',
    generatedAt: new Date().toISOString(),
    feishu,
    steps: [authStep, fieldsStep, recordsStep, writeProbeStep],
    schema: {
      existingFieldNames,
      requiredFieldNames,
      missingRequiredFields,
      existingFieldCount: existingFieldNames.length,
      requiredFieldCount: requiredFieldNames.length,
      note: 'Write permission is proven only by the live writer. This probe is intentionally read-only.',
    },
  };
  writeJson(evidencePath, evidence);
  console.log(JSON.stringify({
    status: evidence.status,
    evidence: evidencePath,
    existingFieldCount: evidence.schema.existingFieldCount,
    requiredFieldCount: evidence.schema.requiredFieldCount,
    missingRequiredFieldCount: evidence.schema.missingRequiredFields.length,
    steps: evidence.steps.map((step) => ({ name: step.name, status: step.status, error: step.error })),
  }, null, 2));
  return evidence;
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { run };
