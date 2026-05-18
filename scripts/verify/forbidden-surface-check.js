const fs=require('fs');
const path=require('path');
const {renderPage}=require('../../apps/web/src/render');
const root=path.resolve(__dirname,'../..');
const routes=['/','/news','/themes','/themes/theme-001'];
const disclaimer='本产品基于公开信息整理，仅供参考，不构成任何投资建议。市场有风险，决策需谨慎。';
const forbidden=['登录','注册','付费','订阅','会员','激活码','我的','权益','输入公开信息','生成研究卡','样例页','荐股','买入','卖出','低吸','仓位','目标价','必涨','龙头确认','主线确认','收益空间','确定性机会','明天看涨','翻倍空间'];
const checks=routes.map(route=>{const html=renderPage(route); const hits=forbidden.filter(t=>html.includes(t)); return {route,hasDisclaimer:html.includes(disclaimer),forbiddenHits:hits,status:(hits.length===0&&html.includes(disclaimer))?'PASS':'HARD_FAIL'};});
const status=checks.every(x=>x.status==='PASS')?'PASS':'HARD_FAIL';
const out={schemaVersion:'2.0',lane:'forbidden-surface',status,checks,updatedAt:new Date().toISOString()};
fs.writeFileSync(path.join(root,'docs/auto-execute/results/forbidden-surface.json'),JSON.stringify(out,null,2));
if(status!=='PASS'){console.error(JSON.stringify(out,null,2)); process.exit(1)}
console.log('forbidden surface PASS');
