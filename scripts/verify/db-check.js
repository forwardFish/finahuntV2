const {writeResult,fail}=require('./lib');const db=require('../../services/data/repository').loadData();
const min={sources:3,rawNews:12,normalizedNews:12,themes:10,themeTags:20,themeRankings:10,researchCards:6,themeChainNodes:20,companies:20,themeCompanyMatches:20,evidences:20,riskNotes:10,observations:10,publishItems:10};
const counts=Object.fromEntries(Object.keys(min).map(k=>[k,(db[k]||[]).length]));const failures=Object.entries(min).filter(([k,v])=>counts[k]<v).map(([k,v])=>`${k} ${counts[k]}<${v}`);
writeResult('db-data-check',{status:failures.length?'HARD_FAIL':'PASS',counts,failures,servingPath:'json',structuredRepository:'postgresql-schema-present'});if(failures.length)fail(failures.join('\n'));console.log('db check PASS');
