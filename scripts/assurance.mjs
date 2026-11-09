#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { table } from './lib/format.mjs';
import { page, table as htmlTable, writeOut } from './lib/render.mjs';

const READS=['clients','jobs','morning-check','missing-results','restore-due','client-health','history','attention','compliance','actions','audit','imports','weekly-review'];
const FLAGS={
 'clients':[], 'jobs':[], 'morning-check':[], 'missing-results':[], 'restore-due':[], 'client-health':[], 'attention':[], 'compliance':[], 'actions':[], 'audit':[], 'imports':[], 'weekly-review':[], 'history':['job'],
 'add-client':['code','name','owner'], 'add-job':['code','client','name','device','owner'],
 'set-policy':['job','rpo-hours','restore-days','owner','evidence'], 'client-review':['client','due','retention-days','evidence','owner'],
 'log-result':['job','time','status','evidence'], 'log-restore':['job','time','outcome','minutes','evidence'],
 'add-action':['code','job','name','owner','due'], 'close-action':['action','evidence'],
 'draft-report':['client'], 'import':['file','source','dry-run'], 'export':['out'], 'help':[]
};
const hash=s=>createHash('sha256').update(s).digest('hex');
function required(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=...`);return o[k].trim();}
function integer(v,label,min=1,max=100000){if(!/^\d+$/.test(String(v))||Number(v)<min||Number(v)>max)throw Error(`${label}: integer ${min}..${max} required`);return Number(v);}
function stamp(v){if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Timestamp requires ISO date, time and timezone'); const date=v.slice(0,10);day(date);return new Date(v).toISOString();}
function day(v){if(!/^\d{4}-\d\d-\d\d$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Valid YYYY-MM-DD date required');return v;}
function code(v){if(!/^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/.test(v))throw Error('Code must be 2..64 letters, digits, underscores or hyphens');return v;}
async function resolve(db,kind,term){
 if(!term)throw Error(`${kind}: name, code or id required`);
 const rows=await db.query(`select id,code,name from ${kind} order by code`);
 const exact=rows.filter(r=>r.id===term||r.code.toLowerCase()===term.toLowerCase());
 const matches=exact.length?exact:rows.filter(r=>r.name.toLowerCase().includes(term.toLowerCase())||r.id.startsWith(term.toLowerCase()));
 if(matches.length!==1)throw Error(`${kind}: ${matches.length?'ambiguous':'no match'} for ${term}\n`+table(matches.length?matches:rows,['id','code','name'].map(key=>({key,label:key}))));
 return matches[0];
}
async function audit(db,actor,operation,record,detail){await db.query('insert into audit(actor,operation,record_id,detail) values($1,$2,$3,$4)',[actor,operation,String(record),JSON.stringify(detail)]);}
async function transaction(db,fn){await db.exec('BEGIN');try{const v=await fn();await db.exec('COMMIT');return v;}catch(e){await db.exec('ROLLBACK');throw e;}}
const statuses=new Map([['success','success'],['failure','failure'],['failed','failure'],['warning','warning'],['no result','no-result'],['no results','no-result'],['no-result','no-result'],['pending','pending']]);
function status(v){const s=statuses.get(String(v).toLowerCase());if(!s)throw Error(`Unrecognised backup status: ${v}`);return s;}
async function recordResult(db,job,time,state,evidence,source){
 const [old]=await db.query('select * from results where job_id=$1 and occurred_at=$2 and source=$3',[job,time,source]);
 if(old){if(old.status!==state)throw Error('Conflicting status at same source, job and timestamp; reconcile the source first');return false;}
 await db.query('insert into results(job_id,occurred_at,status,evidence,source) values($1,$2,$3,$4,$5)',[job,time,state,evidence,source]);return true;
}
function parseImport(raw){
 const doc=JSON.parse(raw);if(!Array.isArray(doc.pages)||!doc.pages.length)throw Error('Export requires pages containing complete GET /v3/clients/devices responses');
 const exported=stamp(doc.exported_at);if(Date.parse(exported)>Date.now()+60000)throw Error('Export timestamp is in the future');
 const total=doc.pages[0].total_count;if(!Number.isInteger(total)||total<0)throw Error('total_count required');
 const rows=[];const seen=new Set();const cursors=new Set();
 doc.pages.forEach((p,i)=>{
  if(!Array.isArray(p.data)||p.total_count!==total||!Object.hasOwn(p,'next_cursor'))throw Error('Invalid or inconsistent export pagination');
  if(i===doc.pages.length-1?p.next_cursor!==null:typeof p.next_cursor!=='string'||!p.next_cursor)throw Error('Incomplete export: final next_cursor must be null');
  if(p.next_cursor!==null){if(cursors.has(p.next_cursor))throw Error('Repeated pagination cursor');cursors.add(p.next_cursor);}
  for(const r of p.data){
   for(const k of ['br_device_id','br_device_name','br_job_name'])if(typeof r[k]!=='string'||!r[k].trim())throw Error(`Missing ${k}`);
   if(!r.client||typeof r.client.br_company_name!=='string'||!r.client.br_company_name.trim())throw Error('Missing original company name');
   const key=JSON.stringify([r.br_device_id,r.br_job_name]);if(seen.has(key))throw Error('Duplicate device/job in export');seen.add(key);
   if(!Array.isArray(r.last_result)||!Array.isArray(r.history))throw Error('last_result and history arrays required');
   const resultTimes=new Set();for(const x of r.last_result){stamp(x.date);status(x.status);if(Date.parse(x.date)>Date.parse(exported))throw Error('Result after export timestamp');if(resultTimes.has(stamp(x.date)))throw Error('Repeated result timestamp');resultTimes.add(stamp(x.date));}
   const days=new Set();for(const h of r.history){stamp(h.date);day(h.date.slice(0,10));if(typeof h.sla_status!=='string'||!h.sla_status.trim())throw Error('History status required');if(Date.parse(h.date)>Date.parse(exported))throw Error('History after export timestamp');if(days.has(h.date.slice(0,10)))throw Error('Repeated history day');days.add(h.date.slice(0,10));}
   rows.push(r);
  }
 });
 if(rows.length!==total)throw Error(`Partial export: expected ${total}, found ${rows.length}`);
 return {doc,rows,exported};
}
async function importRadar(db,o,actor){
 const source=required(o,'source');const raw=fs.readFileSync(required(o,'file'),'utf8');const {doc,rows,exported}=parseImport(raw);const digest=hash(raw);
 const [old]=await db.query('select id,records from imports where source=$1 and sha256=$2',[source,digest]);if(old)return {unchanged:true,records:old.records,import_id:old.id};
 return transaction(db,async()=>{
  const [batch]=await db.query('insert into imports(source,sha256,exported_at,records,actor,payload) values($1,$2,$3,$4,$5,$6) returning id',[source,digest,exported,rows.length,actor,JSON.stringify(doc)]);
  let inserted=0,results=0;
  for(const r of rows){
   const ckey=r.client.client_id?`id:${r.client.client_id}`:`name:${r.client.br_company_name}`;
   let [c]=await db.query('select id from clients where source=$1 and source_key=$2',[source,ckey]);
   if(!c)[c]=await db.query('insert into clients(code,name,source,source_key) values($1,$2,$3,$4) returning id',['BR-C-'+hash(source+ckey).slice(0,16),r.client.br_company_name,source,ckey]);
   const jkey=JSON.stringify([r.br_device_id,r.br_job_name]);let [j]=await db.query('select id,client_id from jobs where source=$1 and source_key=$2',[source,jkey]);
   if(j&&j.client_id!==c.id)throw Error('Device/job changed client; reconcile ownership before importing');
   if(!j){[j]=await db.query('insert into jobs(code,client_id,name,device,classification,source,source_key) values($1,$2,$3,$4,$5,$6,$7) returning id',['BR-J-'+hash(source+jkey).slice(0,16),c.id,r.br_job_name,r.br_device_name,r.br_backup_classification||'',source,jkey]);inserted++;}
   for(const x of r.last_result)if(await recordResult(db,j.id,stamp(x.date),status(x.status),`Backup Radar snapshot ${digest}`,source))results++;
   for(const h of r.history)await db.query('insert into vendor_history(job_id,import_id,day,sla_status) values($1,$2,$3,$4)',[j.id,batch.id,h.date.slice(0,10),h.sla_status]);
  }
  const summary={import_id:batch.id,records:rows.length,new_jobs:inserted,new_results:results,policies:'Set your owner, recovery interval and restore cadence after import'};
  await audit(db,actor,'import',batch.id,{source,sha256:digest,records:rows.length});
  if(o['dry-run']){await db.exec('ROLLBACK');await db.exec('BEGIN');return {...summary,dry_run:true};}return summary;
 });
}
async function health(db,at){return db.query('select * from assurance_health($1) order by code',[at]);}
export async function run(db,args){
 const o={};const positional=[];
 for(const a of args){if(a.startsWith('--')){const [k,...vs]=a.slice(2).split('=');if(k in o)throw Error(`Duplicate --${k}`);o[k]=vs.length?vs.join('='):true;}else positional.push(a);}
 const cmd=positional[0]||'help';if(!(cmd in FLAGS))throw Error(`Unknown command ${cmd}; run help`);
 for(const k of Object.keys(o))if(![...FLAGS[cmd],'json','actor','at'].includes(k))throw Error(`Unknown option --${k} for ${cmd}`);
 if(positional.length>(cmd==='import'?2:1)||cmd==='import'&&positional[1]!=='backup-radar')throw Error('Use import backup-radar; other commands take named options');
 for(const k of ['json','dry-run'])if(k in o&&o[k]!==true)throw Error(`--${k} takes no value`);
 const at=o.at?stamp(o.at):new Date().toISOString();
 if(cmd==='help')return {commands:Object.keys(FLAGS),options:FLAGS,common:'--json for machine output; --at=ISO timestamp for report cutoff; writes require --actor=Name. Details in .claude/commands.'};
 const actor=!READS.includes(cmd)&&!['export','draft-report'].includes(cmd)?required(o,'actor'):null;
 if(!READS.includes(cmd)&&o.at)throw Error('--at is only allowed for reads');
 if(cmd==='clients')return db.query('select code,name,owner,review_due,retention_days from clients order by code');
 if(cmd==='jobs')return db.query('select j.code,c.name client,j.name,j.device,j.owner,j.rpo_hours,j.restore_days,j.active from jobs j join clients c on c.id=j.client_id order by j.code');
 if(cmd==='morning-check')return (await health(db,at)).map(({code,client,name,state,last_result,last_success,owner})=>({code,client,name,state,last_result,last_success,owner}));
 if(cmd==='missing-results')return (await health(db,at)).filter(r=>!r.last_result||r.state==='stale-results').map(({code,client,name,last_result,rpo_hours,state})=>({code,client,name,last_result,rpo_hours,state}));
 if(cmd==='restore-due')return (await health(db,at)).filter(r=>r.restore_state!=='current').map(({code,client,name,restore_state,last_restore,restore_due,owner})=>({code,client,name,restore_state,last_restore,restore_due,owner}));
 if(cmd==='client-health')return db.query(`select c.code,c.name,count(h.id)::int jobs,count(h.id) filter(where h.state<>'current-success')::int backup_exceptions,count(h.id) filter(where h.restore_state<>'current')::int restore_exceptions from clients c left join assurance_health($1) h on h.client_id=c.id group by c.id order by c.code`,[at]);
 if(cmd==='history'){const j=await resolve(db,'jobs',required(o,'job'));return {job:j,results:await db.query('select occurred_at,status,evidence,source from results where job_id=$1 and occurred_at<=$2 order by occurred_at desc',[j.id,at]),restore_tests:await db.query('select tested_at,outcome,recovery_minutes,evidence,actor from restore_tests where job_id=$1 and tested_at<=$2 order by tested_at desc',[j.id,at]),vendor_daily:await db.query('select day,sla_status,import_id from vendor_history where job_id=$1 and day<=$2::timestamptz::date order by day desc',[j.id,at])};}
 if(cmd==='actions')return db.query('select a.code,j.code job,a.name,a.owner,a.due_on,a.status,a.evidence from actions a join jobs j on j.id=a.job_id order by a.due_on,a.code');
 if(cmd==='audit')return db.query('select actor,operation,record_id,detail,created_at from audit order by created_at,id');
 if(cmd==='imports')return db.query('select source,exported_at,records,sha256,actor from imports order by exported_at,source');
 if(cmd==='attention'){
  const h=await health(db,at);return [
   ...h.filter(r=>r.state!=='current-success').map(r=>({reason:'backup-'+r.state,code:r.code,name:r.name,owner:r.owner})),
   ...h.filter(r=>r.restore_state!=='current').map(r=>({reason:'restore-'+r.restore_state,code:r.code,name:r.name,owner:r.owner})),
   ...await db.query("select 'action-overdue' reason,code,name,owner from actions where status='open' and due_on<$1::timestamptz::date order by code",[at]),
   ...await db.query("select 'client-review' reason,code,name,owner from clients where review_due is null or review_due<$1::timestamptz::date or owner='' order by code",[at])];
 }
 if(cmd==='compliance'){
  const h=await health(db,at);return [
   ...h.filter(r=>r.state!=='current-success').map(r=>({rule:'BACKUP-01',code:r.code,finding:r.state,source:'https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight'})),
   ...h.filter(r=>r.restore_state!=='current').map(r=>({rule:'RESTORE-02',code:r.code,finding:r.restore_state,source:'https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight'})),
   ...await db.query("select 'SECURITY-03' rule,code,'security evidence or review missing/overdue' finding,'https://www.privacy.org.nz/privacy-principles/5/' source from clients where security_evidence='' or review_due is null or review_due<$1::timestamptz::date",[at]),
   ...await db.query("select 'RETENTION-04' rule,code,'retention decision missing' finding,'https://www.privacy.org.nz/privacy-principles/9/' source from clients where retention_days is null")];
 }
 if(cmd==='weekly-review'){const common=[`--at=${at}`];return {as_of:at,backups:await run(db,['morning-check',...common]),restores:await run(db,['restore-due',...common]),attention:await run(db,['attention',...common])};}
 if(cmd==='import')return importRadar(db,o,actor);
 if(cmd==='export'){
  const data={format:'backup-assurance-v1',exported_at:at};for(const t of ['clients','jobs','results','restore_tests','actions','imports','vendor_history','audit'])data[t]=await db.query(`select * from ${t} order by id`);
  const out=path.resolve(required(o,'out'));fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return {file:out,counts:Object.fromEntries(Object.entries(data).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length]))};
 }
 if(cmd==='draft-report'){
  const c=await resolve(db,'clients',required(o,'client'));const rows=(await health(db,at)).filter(r=>r.client_id===c.id);
  const actions=await db.query('select a.code,a.name,a.owner,a.due_on,a.status from actions a join jobs j on j.id=a.job_id where j.client_id=$1 order by a.due_on',[c.id]);
  const file=writeOut('drafts',`backup-review-${c.code}-${Date.now()}`,page({title:'Draft backup assurance review',subtitle:c.name,sections:[{title:'Recorded backup and restore position',note:'Manual evidence review. Current success is a recorded result, not proof of recoverability.',html:htmlTable(rows,['code','name','state','last_result','restore_state','owner'])},{title:'Follow-up work',html:htmlTable(actions)}]}));return {file,draft:true,sent:false};
 }
 return transaction(db,async()=>{
  let result;
  if(cmd==='add-client'){
   [result]=await db.query('insert into clients(code,name,owner) values($1,$2,$3) returning *',[code(required(o,'code')),required(o,'name'),required(o,'owner')]);
  }else if(cmd==='add-job'){
   const c=await resolve(db,'clients',required(o,'client'));
   [result]=await db.query('insert into jobs(code,client_id,name,device,owner) values($1,$2,$3,$4,$5) returning *',[code(required(o,'code')),c.id,required(o,'name'),required(o,'device'),required(o,'owner')]);
  }else if(cmd==='set-policy'){
   const j=await resolve(db,'jobs',required(o,'job'));
   [result]=await db.query('update jobs set rpo_hours=$1,restore_days=$2,owner=$3,policy_evidence=$4 where id=$5 returning *',[integer(required(o,'rpo-hours'),'rpo-hours',1,8760),integer(required(o,'restore-days'),'restore-days',1,3660),required(o,'owner'),required(o,'evidence'),j.id]);
  }else if(cmd==='client-review'){
   const c=await resolve(db,'clients',required(o,'client'));
   [result]=await db.query('update clients set review_due=$1,retention_days=$2,security_evidence=$3,owner=$4 where id=$5 returning *',[day(required(o,'due')),integer(required(o,'retention-days'),'retention-days'),required(o,'evidence'),required(o,'owner'),c.id]);
  }else if(cmd==='log-result'||cmd==='log-restore'){
   const j=await resolve(db,'jobs',required(o,'job'));const time=stamp(required(o,'time'));if(Date.parse(time)>Date.now())throw Error('Evidence cannot be recorded in the future');
   if(cmd==='log-result'){const added=await recordResult(db,j.id,time,status(required(o,'status')),required(o,'evidence'),'manual');result={id:j.id,added,time,status:status(o.status)};}
   else{const outcome=required(o,'outcome');if(!['passed','failed'].includes(outcome))throw Error('outcome must be passed or failed');[result]=await db.query('insert into restore_tests(job_id,tested_at,outcome,recovery_minutes,evidence,actor) values($1,$2,$3,$4,$5,$6) returning *',[j.id,time,outcome,integer(required(o,'minutes'),'minutes',0),required(o,'evidence'),actor]);}
  }else if(cmd==='add-action'){
   const j=await resolve(db,'jobs',required(o,'job'));[result]=await db.query('insert into actions(code,job_id,name,owner,due_on) values($1,$2,$3,$4,$5) returning *',[code(required(o,'code')),j.id,required(o,'name'),required(o,'owner'),day(required(o,'due'))]);
  }else if(cmd==='close-action'){
   const a=await resolve(db,'actions',required(o,'action'));[result]=await db.query("update actions set status='done',evidence=$1 where id=$2 returning *",[required(o,'evidence'),a.id]);
  }
  await audit(db,actor,cmd,result.id,result);return result;
 });
}
function display(value){
 if(Array.isArray(value))return table(value,Object.keys(value[0]||{}).map(key=>({key,label:key,format:v=>v instanceof Date?v.toISOString():v&&typeof v==='object'?JSON.stringify(v):v})));
 return Object.entries(value).map(([k,v])=>Array.isArray(v)?`${k}\n${display(v)}`:`${k}: ${v&&typeof v==='object'?JSON.stringify(v):v}`).join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const out=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(out,null,2):display(out));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
