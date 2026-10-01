import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
const port=Number(process.env.SAMESIDE_TEST_PORT||55438);
const config={host:'127.0.0.1',port,user:'postgres',password:''};
const root=new pg.Client({...config,database:'postgres'});await root.connect();
const database='pairing_'+randomUUID().replaceAll('-','');await root.query(`create database ${database}`);await root.end();
const db=new pg.Pool({...config,database});let passed=0;
async function test(name,fn){await fn();console.log(`ok ${++passed} - ${name}`)}
async function as(u,sql,args=[],role='authenticated') {const c=await db.connect();try{await c.query('begin');await c.query(`set local role ${role}`);await c.query("select set_config('request.jwt.claim.sub',$1,true)",[u||'']);const r=await c.query(sql,args);await c.query('commit');return r.rows;}catch(e){await c.query('rollback');throw e;}finally{c.release();}}
const rpc=(u,name,args=[],types=[])=>as(u,`select to_jsonb(public.${name}(${args.map((_,i)=>'$'+(i+1)+(types[i]?'::'+types[i]:'')).join(',')})) result`,args).then(r=>r[0]?.result);
const fail=(fn,pattern)=>assert.rejects(fn,e=>e.message.includes(pattern));
const [A,B,C,D,E,F,G,H]=Array.from({length:8},()=>randomUUID());
const move=(u,slot=0)=>rpc(u,'get_or_create_today_assignment',[slot]);
const prefs=u=>rpc(u,'save_my_routine_preferences',[['conversation']],['text[]']);
async function pair(a,b){const rid=await rpc(a,'create_relationship',['UTC']);await prefs(a);await rpc(a,'choose_shared_flower',['cosmos']);const token=await rpc(a,'create_relationship_invite');await rpc(b,'accept_relationship_invite',[token]);await prefs(b);return {rid,token};}
try {
 await db.query(await readFile(new URL('./platform-bootstrap.sql',import.meta.url),'utf8'));
 // Model the accidental production-only reset without ever deleting any data.
 await db.query("create function public.development_reset_my_sameside_data() returns boolean language sql security definer as $$select true$$");
 for(const name of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort()){
  try{await db.query(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8'));}catch(e){throw Error(name+': '+e.message,{cause:e})}
 }
 await db.query("insert into auth.users(id) select unnest($1::uuid[])",[[A,B,C,D,E,F,G,H]]);
 let rid,token,a,b;
 await test('all migrations replay; reset blocked; lifecycle APIs available',async()=>{
  assert.equal((await db.query("select has_function_privilege('authenticated','public.development_reset_my_sameside_data()','execute') ok")).rows[0].ok,false);
  await fail(()=>rpc(A,'development_reset_my_sameside_data'),'permission denied');
  await fail(()=>as(null,'select public.leave_relationship()',[],'anon'),'permission denied');
 });
 await test('both partners must join and personalize before activation',async()=>{
  rid=await rpc(A,'create_relationship',['UTC']);await prefs(A);await rpc(A,'choose_shared_flower',['cosmos']);await fail(()=>move(A),'routine_not_ready');
  token=await rpc(A,'create_relationship_invite');await fail(()=>rpc(A,'accept_relationship_invite',[token]),'own_invite');
  await rpc(B,'accept_relationship_invite',[token]);await fail(()=>move(A),'routine_not_ready');await prefs(B);
  assert.equal((await rpc(B,'get_routine_activation_state')).activated,true);
 });
 await test('acceptance retries are idempotent; third member blocked',async()=>{
  assert.deepEqual(await Promise.all([rpc(B,'accept_relationship_invite',[token]),rpc(B,'accept_relationship_invite',[token])]),[rid,rid]);
  await fail(()=>rpc(C,'accept_relationship_invite',[token]),'invite_already_used');
 });
 await test('concurrent identical preferences yield distinct primary Moves and stable retries',async()=>{
  [a,b]=await Promise.all([move(A),move(B)]);assert.notEqual(a.task_key,b.task_key);assert.equal(a.program_day,1);assert.equal(b.program_day,1);
  assert.equal((await move(A)).id,a.id);assert.equal((await move(B)).id,b.id);
 });
 await test('private assignments and reflections stay private',async()=>{
  assert.equal((await as(A,'select id from public.task_assignments where user_id=$1',[B])).length,0);
  assert.equal((await as(C,'select id from public.relationships where id=$1',[rid])).length,0);
  await rpc(A,'save_my_daily_reflection',['Only A can read this.']);
  assert.equal((await as(B,'select * from public.daily_reflections where user_id=$1',[A])).length,0);
  await fail(()=>as(A,'select * from public.garden_events'),'permission denied');
 });
 await test('sequential extras, atomic completion and three-Move cap remain intact',async()=>{
  await fail(()=>move(A,1),'previous_slot_not_completed');
  await Promise.all([rpc(A,'complete_assignment',[a.id]),rpc(A,'complete_assignment',[a.id])]);
  assert.equal((await db.query('select count(*)::int n from public.garden_events where source_assignment_id=$1',[a.id])).rows[0].n,1);
  const keys=new Set([a.task_key,b.task_key]);
  await rpc(B,'complete_assignment',[b.id]);
  for(const slot of [1,2]){const tasks=await Promise.all([move(A,slot),move(B,slot)]);for(const t of tasks){assert(!keys.has(t.task_key));keys.add(t.task_key);}await Promise.all(tasks.map(t=>rpc(t.user_id,'complete_assignment',[t.id])));}
  assert.equal(keys.size,6);await fail(()=>move(A,3),'invalid_slot');
 });
 await test('anonymous preview reveals only intended fields',async()=>{
  assert.deepEqual(await as(null,'select * from public.preview_relationship_invite($1)',['bad'],'anon'),[{invite_state:'invalid',display_name:null}]);
  await fail(()=>as(null,'select * from public.relationship_invites',[],'anon'),'permission denied');
 });
 await test('blank partner name does not lose paired status; physical garden API works',async()=>{
  const overview=await rpc(A,'get_relationship_overview');assert.equal(overview.partner_active,true);assert.equal(overview.active_member_count,2);
  assert.equal((await rpc(A,'get_physical_garden_state')).status,'growing');
 });
 await test('seventh active day stays week one for both partners after completion',async()=>{
  await db.query('update public.relationships set path_started_at=current_date-6 where id=$1',[rid]);
  await db.query("insert into public.garden_events(relationship_id,created_by,event_date) select $1,$2,current_date-n from generate_series(1,6)n",[rid,A]);
  for(const u of [A,B]){const p=await rpc(u,'get_routine_progress');assert.equal(p.program_day,7);assert.equal(p.week_no,1);assert.equal(p.active_days,7);assert.equal((await rpc(u,'get_my_root_pulse')).week_no,1);assert.equal((await rpc(u,'save_my_root_pulse',['doing_well','appreciation'])).week_no,1);}
 });
 await test('leave preserves garden history, closes old pairing, permits fresh relationship',async()=>{
  const count=(await db.query('select count(*)::int n from public.garden_events where relationship_id=$1',[rid])).rows[0].n;
  assert.equal(await rpc(B,'leave_relationship'),rid);assert.equal((await rpc(A,'get_relationship_overview')).has_departure,true);
  await fail(()=>rpc(A,'create_relationship_invite'),'relationship_closed');
  assert.equal((await db.query('select count(*)::int n from public.garden_events where relationship_id=$1',[rid])).rows[0].n,count);
  assert.equal((await as(B,'select id from public.relationships where id=$1',[rid])).length,0);
 });
 await test('new relationship on same date does not return old assignment',async()=>{
  const {rid:old}=await pair(D,E);const oldMove=await move(E);await rpc(E,'leave_relationship');
  const {rid:fresh}=await pair(F,E);const freshMove=await move(E);assert.notEqual(old,fresh);assert.notEqual(freshMove.id,oldMove.id);assert.equal(freshMove.relationship_id,fresh);
 });
 await test('expired and revoked invitations rejected; concurrent acceptance has one winner',async()=>{
  const r=await rpc(G,'create_relationship',['UTC']);let t=await rpc(G,'create_relationship_invite');await rpc(G,'revoke_relationship_invites');await fail(()=>rpc(H,'accept_relationship_invite',[t]),'invite_revoked');
  t=await rpc(G,'create_relationship_invite');await db.query("update public.relationship_invites set expires_at=now()-interval '1 day' where relationship_id=$1",[r]);await fail(()=>rpc(H,'accept_relationship_invite',[t]),'invite_expired');
  t=await rpc(G,'create_relationship_invite');const results=await Promise.allSettled([rpc(H,'accept_relationship_invite',[t]),rpc(C,'accept_relationship_invite',[t])]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 });
 await test('28 active days finish the journey; missed calendar days do not advance it',async()=>{
  await db.query('update public.relationships set path_started_at=current_date-40 where id=$1',[rid]);
  // Only 7 active dates despite 40 calendar days.
  assert.equal((await rpc(A,'get_routine_progress')).program_day,7);
  await db.query('insert into public.garden_events(relationship_id,created_by,event_date) select $1,$2,current_date-n from generate_series(7,28)n',[rid,A]);
  assert.equal((await rpc(A,'get_routine_progress')).programme_complete,true);
  await fail(()=>move(A),'path_complete');
  assert.equal((await rpc(A,'get_my_root_pulse')).can_edit,false);
 });
 await test('relationship timezone determines the assignment date',async()=>{
  const r=(await as(F,'select relationship_id from public.relationship_members where user_id=$1 and left_at is null',[F]))[0].relationship_id;
  await db.query("update public.relationships set timezone='Pacific/Kiritimati' where id=$1",[r]);
  const task=await move(F);const expected=(await db.query("select to_char(now() at time zone 'Pacific/Kiritimati','YYYY-MM-DD') d")).rows[0].d;
  assert.equal(task.assigned_for_date,expected);
 });
 console.log(`PASS ${passed} groups; local database ${database}`);
}finally{await db.end();}
