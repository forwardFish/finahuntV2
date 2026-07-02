const fs = require('node:fs'); const path = require('node:path');
const repo = require('../data/repository'); const { analyze } = require('./model-router');
const db = repo.loadData(); const card = analyze(db.normalizedNews[0], db);
const root = path.join(__dirname, '../..'); const out = path.join(root, 'docs/auto-execute/results'); const logs=path.join(root,'docs/auto-execute/logs'); fs.mkdirSync(out,{recursive:true}); fs.mkdirSync(logs,{recursive:true});
const status = card.compliance.status === 'passed' ? 'PASS' : 'HARD_FAIL';
fs.writeFileSync(path.join(out,'ai-worker-schema.json'), JSON.stringify({status, requiredFields:['event','catalyst','theme','theme_chain','companies','evidences','risks','observation_points','expectation_gap','compliance'], card},null,2));
fs.writeFileSync(path.join(out,'compliance-guard.json'), JSON.stringify({status, blockedTerms:card.compliance.blocked_terms},null,2));
fs.writeFileSync(path.join(logs,'ai-worker.log'), JSON.stringify(card,null,2));
console.log(JSON.stringify(card,null,2)); process.exit(status === 'PASS' ? 0 : 1);
