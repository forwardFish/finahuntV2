const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.join(__dirname,'../..');
function ensure(p){fs.mkdirSync(p,{recursive:true})}
function writeResult(name,obj){const dir=path.join(root,'docs/auto-execute/results');ensure(dir);fs.writeFileSync(path.join(dir,`${name}.json`),JSON.stringify(obj,null,2))}
function fail(msg){console.error(msg);process.exit(1)}
function get(url,headers={}){return new Promise((resolve,reject)=>{http.get(url,{headers},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(b)})}catch{resolve({status:res.statusCode,body:b})}})}).on('error',reject)})}
function walk(p){const st=fs.statSync(p);if(st.isFile())return[p];let out=[];for(const e of fs.readdirSync(p)){if(['node_modules','.git','.omx','docs'].includes(e))continue;out=out.concat(walk(path.join(p,e)))}return out}
function forbiddenScan(paths){const terms=require('../../services/shared/compliance').FORBIDDEN_TERMS,hits=[];for(const rel of paths){const p=path.join(root,rel);if(!fs.existsSync(p))continue;for(const f of walk(p)){if(!/\.(js|json|html|css|wxml|wxss|md)$/.test(f))continue;const txt=fs.readFileSync(f,'utf8');for(const t of terms){if(txt.includes(t)&&!f.includes('compliance.js'))hits.push({file:path.relative(root,f),term:t})}}}return hits}
module.exports={root,ensure,writeResult,fail,get,walk,forbiddenScan};
