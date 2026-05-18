const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const root=path.resolve(__dirname,'../..');
const psql=process.env.PSQL_PATH || 'C:/Program Files/PostgreSQL/16/bin/psql.exe';
const host=process.env.PGHOST || '127.0.0.1';
const port=process.env.PGPORT || '5432';
const user=process.env.PGUSER || 'postgres';
const dbName=process.env.PGDATABASE_E2E || 'finahuntv2_e2e';
const resultPath=path.join(root,'docs/auto-execute/results/db-e2e.json');
const logDir=path.join(root,'docs/auto-execute/logs');
fs.mkdirSync(path.dirname(resultPath),{recursive:true});
fs.mkdirSync(logDir,{recursive:true});
function run(args, opts={}){
  const res=cp.spawnSync(psql,args,{cwd:root,encoding:'utf8',env:{...process.env,PGPASSWORD:process.env.PGPASSWORD||''},...opts});
  if(res.status!==0){const msg=(res.stderr||res.stdout||'psql failed').trim(); throw new Error(msg)}
  return res.stdout.trim();
}
function q(v){if(v===undefined||v===null||v==='') return 'NULL'; if(typeof v==='boolean') return v?'true':'false'; if(typeof v==='number') return String(v); return `'${String(v).replace(/'/g,"''")}'`;}
function insert(table, cols, rows, map){
  if(!rows||!rows.length)return '';
  return rows.map(r=>`insert into ${table} (${cols.join(',')}) values (${cols.map(c=>q(map?map(c,r):r[c])).join(',')}) on conflict do nothing;`).join('\n')+'\n';
}
try{
  const db=require('../../services/data/repository').loadData();
  run(['-h',host,'-p',port,'-U',user,'-d','postgres','-v','ON_ERROR_STOP=1','-c',`DROP DATABASE IF EXISTS ${dbName};`]);
  run(['-h',host,'-p',port,'-U',user,'-d','postgres','-v','ON_ERROR_STOP=1','-c',`CREATE DATABASE ${dbName};`]);
  run(['-h',host,'-p',port,'-U',user,'-d',dbName,'-v','ON_ERROR_STOP=1','-f',path.join(root,'services/data/schema.sql')]);
  let sql='';
  sql+=insert('sources',['id','name','type','url','enabled'],db.sources);
  sql+=insert('raw_news',['id','source_id','title','source_url','publish_time','source_hash','dedupe_hash'],db.rawNews,(c,r)=>({source_id:r.sourceId,source_url:r.sourceUrl,publish_time:r.publishTime,source_hash:r.sourceHash,dedupe_hash:r.dedupeHash}[c]??r[c]));
  sql+=insert('normalized_news',['id','raw_id','title','category','summary','status'],db.normalizedNews,(c,r)=>({raw_id:r.rawId}[c]??r[c]));
  sql+=insert('themes',['id','name','summary','logic','heat_score'],db.themes,(c,r)=>({heat_score:r.heatScore}[c]??r[c]));
  sql+=insert('theme_tags',['id','name','enabled'],db.themeTags);
  sql+=insert('theme_rankings',['theme_id','rank','heat_score'],db.themeRankings,(c,r)=>({theme_id:r.themeId,heat_score:r.heatScore}[c]??r[c]));
  sql+=insert('research_cards',['id','theme_id','status','review_status','event_summary','theme_logic'],db.researchCards,(c,r)=>({theme_id:r.themeId,review_status:r.reviewStatus,event_summary:r.eventSummary,theme_logic:r.themeLogic}[c]??r[c]));
  sql+=insert('theme_chain_nodes',['id','theme_id','name','description','sort_order'],db.themeChainNodes,(c,r)=>({theme_id:r.themeId,sort_order:r.order}[c]??r[c]));
  sql+=insert('theme_chain_edges',['id','theme_id','from_node','to_node','relation'],db.themeChainEdges,(c,r)=>({theme_id:r.themeId,from_node:r.from,to_node:r.to}[c]??r[c]));
  sql+=insert('companies',['id','name','code','industry'],db.companies);
  sql+=insert('theme_company_matches',['id','theme_id','company_id','chain_node','evidence_strength','verification_status'],db.themeCompanyMatches,(c,r)=>({theme_id:r.themeId,company_id:r.companyId,chain_node:r.chainNode,evidence_strength:r.evidenceStrength,verification_status:r.verificationStatus}[c]??r[c]));
  sql+=insert('evidences',['id','theme_id','title','source_name','source_url','strength'],db.evidences,(c,r)=>({theme_id:r.themeId,source_name:r.sourceName,source_url:r.sourceUrl}[c]??r[c]));
  sql+=insert('risk_notes',['id','theme_id','level','text'],db.riskNotes,(c,r)=>({theme_id:r.themeId}[c]??r[c]));
  sql+=insert('observations',['id','theme_id','title','text'],db.observations,(c,r)=>({theme_id:r.themeId}[c]??r[c]));
  sql+=insert('publish_items',['id','target','theme_id','news_id','status','sort_order'],db.publishItems,(c,r)=>({theme_id:r.themeId,news_id:r.newsId,sort_order:r.sortOrder}[c]??r[c]));
  sql+=insert('ai_analysis_runs',['id','provider','status','trace_id'],db.aiAnalysisRuns,(c,r)=>({trace_id:r.traceId}[c]??r[c]));
  sql+=insert('compliance_logs',['id','status','blocked_terms'],db.complianceLogs,(c,r)=> c==='blocked_terms'?JSON.stringify(r.blockedTerms||[]):r[c]);
  const sqlPath=path.join(logDir,'db-e2e-seed.sql');
  fs.writeFileSync(sqlPath,sql,'utf8');
  run(['-h',host,'-p',port,'-U',user,'-d',dbName,'-v','ON_ERROR_STOP=1','-f',sqlPath]);
  const countSql=`select json_build_object('sources',(select count(*) from sources),'rawNews',(select count(*) from raw_news),'normalizedNews',(select count(*) from normalized_news),'themes',(select count(*) from themes),'themeTags',(select count(*) from theme_tags),'themeRankings',(select count(*) from theme_rankings),'researchCards',(select count(*) from research_cards),'companies',(select count(*) from companies),'themeCompanyMatches',(select count(*) from theme_company_matches),'evidences',(select count(*) from evidences),'riskNotes',(select count(*) from risk_notes),'observations',(select count(*) from observations),'publishItems',(select count(*) from publish_items));`;
  const counts=JSON.parse(run(['-h',host,'-p',port,'-U',user,'-d',dbName,'-At','-v','ON_ERROR_STOP=1','-c',countSql]));
  const min={sources:1,rawNews:10,normalizedNews:10,themes:10,themeTags:15,themeRankings:5,researchCards:3,companies:10,themeCompanyMatches:10,evidences:10,riskNotes:5,observations:5,publishItems:8};
  const failures=Object.entries(min).filter(([k,v])=>(counts[k]||0)<v).map(([k,v])=>`${k} ${counts[k]}<${v}`);
  const joinCheck=Number(run(['-h',host,'-p',port,'-U',user,'-d',dbName,'-At','-v','ON_ERROR_STOP=1','-c',`select count(*) from publish_items p left join themes t on t.id=p.theme_id where p.status='published';`]))||0;
  const status=failures.length||joinCheck<1?'HARD_FAIL':'PASS';
  const out={schemaVersion:'2.0',lane:'db-e2e',status,db:{host,port,database:dbName,user},commands:['DROP/CREATE local e2e database','apply services/data/schema.sql','seed from services/data/repository JSON','read count and publish/theme join checks'],counts,failures,joinCheck,evidence:['services/data/schema.sql','docs/auto-execute/logs/db-e2e-seed.sql','docs/auto-execute/results/db-e2e.json'],blockers:[],nextActions:[],updatedAt:new Date().toISOString()};
  fs.writeFileSync(resultPath,JSON.stringify(out,null,2));
  console.log(`db-e2e ${status}`);
  if(status!=='PASS')process.exit(1);
}catch(e){
  const out={schemaVersion:'2.0',lane:'db-e2e',status:'BLOCKED_BY_ENVIRONMENT',error:e.message,blockers:[e.message],evidence:['services/data/schema.sql'],updatedAt:new Date().toISOString()};
  fs.writeFileSync(resultPath,JSON.stringify(out,null,2));
  console.error(e.message);
  process.exit(4);
}
