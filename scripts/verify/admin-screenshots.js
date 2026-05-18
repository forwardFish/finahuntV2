const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const {chromium}=require('playwright');
const root=process.cwd();
const outDir=path.join(root,'docs/auto-execute/screenshots/admin');
fs.mkdirSync(outDir,{recursive:true});
const server=spawn(process.execPath,['services/api/server.js'],{cwd:root,env:{...process.env,PORT:'3000'},stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(){for(let i=0;i<45;i++){try{const r=await fetch('http://127.0.0.1:3000/health'); if(r.ok)return;}catch{} await sleep(1000);} throw new Error('server not ready');}
(async()=>{const shots=[]; try{await wait(); const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:1448,height:1086}}); for(const [id,route] of [['admin-home','/admin'],['admin-sources','/admin/sources'],['admin-raw-news','/admin/raw-news'],['admin-publish-items','/admin/publish-items']]){await page.goto('http://127.0.0.1:3000'+route,{waitUntil:'networkidle',timeout:45000}); const rel='docs/auto-execute/screenshots/admin/'+id+'.png'; await page.screenshot({path:path.join(root,rel),fullPage:false}); const health=await page.evaluate(()=>({title:document.title,textLength:document.body.innerText.length,visibleElements:document.querySelectorAll('body *').length})); shots.push({id,route,status:health.textLength>20?'PASS':'HARD_FAIL',screenshot:rel,pageHealth:health});} await browser.close(); const status=shots.every(s=>s.status==='PASS')?'PASS':'HARD_FAIL'; fs.writeFileSync(path.join(root,'docs/auto-execute/results/admin-screenshots.json'),JSON.stringify({schemaVersion:'2.0',lane:'admin-screenshots',status,shots,updatedAt:new Date().toISOString()},null,2)); process.exit(status==='PASS'?0:1);} catch(e){fs.writeFileSync(path.join(root,'docs/auto-execute/results/admin-screenshots.json'),JSON.stringify({schemaVersion:'2.0',lane:'admin-screenshots',status:'HARD_FAIL',error:e.message,updatedAt:new Date().toISOString()},null,2)); process.exit(1);} finally{server.kill();}})();
