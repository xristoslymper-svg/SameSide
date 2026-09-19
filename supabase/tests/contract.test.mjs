import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import pg from 'pg';

// Intentionally no remote connection string: this runner can only create a fresh loopback database.
const port=Number(process.env.SAMESIDE_TEST_PORT||55437);
if(!Number.isInteger(port)||port<1024||port>65535) throw Error('Invalid local test port');
const config={host:'127.0.0.1',port,user:'postgres',password:process.env.SAMESIDE_TEST_PASSWORD||''};
const root=new pg.Client({...config,database:'postgres'});
await root.connect();
const database='sameside_test_'+randomUUID().replaceAll('-','');
await root.query(`create database ${database}`);
await root.end();
const db=new pg.Pool({...config,database,max:12});
const dir=path.dirname(fileURLToPath(import.meta.url));
let passed=0;
async function test(name,fn){await fn();passed++;console.log(`ok ${passed} - ${name}`);}
async function as(user,sql,args=[],role='authenticated'){
 const c=await db.connect();
 try {await c.query('begin');await c.query(`set local role ${role}`);
  await c.query("select set_config('request.jwt.claim.sub',$1,true)",[user||'']);
  const r=await c.query(sql,args);await c.query('commit');return r.rows;
 }catch(e){await c.query('rollback');throw e;}finally{c.release();}
}
const rpc=(u,name,args=[],types=[])=>as(u,`select to_jsonb(public.${name}(${args.map((_,i)=>'$'+(i+1)+(types[i]?'::'+types[i]:'')).join(',')})) as result`,args).then(r=>r[0].result);
async function fail(fn,message){await assert.rejects(fn,e=>e.message.includes(message));}
const users={};for(const name of ['A','B','C','D','E','F','G','H','I','J','K','L'])users[name]=randomUUID();
const {A,B,C,D,E,F,G,H,I,J,K,L}=users;
let rid,invite,a0,b0,oldAssignment,oldEvent;
try{
 await db.query(await readFile(path.join(dir,'platform-bootstrap.sql'),'utf8'));
 const migrations=(await readdir(path.join(dir,'../migrations'))).filter(x=>x.endsWith('.sql')).sort();
 for(const name of migrations.filter(x=>!x.includes('phase1a_') && !x.includes('private_roots_checkin') && !x.includes('shared_flower_private_reflections') && !x.includes('legacy_flower_choice')))await db.query(await readFile(path.join(dir,'../migrations',name),'utf8'));
 await db.query("insert into auth.users(id,raw_user_meta_data) select unnest($1::uuid[]),'{}'::jsonb",[Object.values(users)]);
 rid=await rpc(A,'create_solo_relationship');
 await db.query("update public.relationships set path_started_at=current_date-8 where id=$1",[rid]);
 oldAssignment=(await db.query("insert into public.task_assignments(relationship_id,user_id,task_key,assigned_for_date,status,completed_at) values($1,$2,'legacy-safe-history',current_date-1,'completed',now()-interval '1 day') returning id",[rid,A])).rows[0].id;
 oldEvent=(await db.query("insert into public.garden_events(relationship_id,created_by,source_assignment_id,event_date) values($1,$2,$3,current_date-1) returning id",[rid,A,oldAssignment])).rows[0].id;
 await db.query("insert into public.root_preferences(relationship_id,user_id,week_no,need) values($1,$2,2,'conversation')",[rid,A]);
 await test('baseline confirms missing helper permission',async()=>{
  assert.equal((await db.query("select has_function_privilege('authenticated','public.is_relationship_member(uuid)','EXECUTE') as ok")).rows[0].ok,false);
 });
 for(const name of migrations.filter(x=>x.includes('phase1a_'))){
  const c=await db.connect();try{await c.query('begin');await c.query(await readFile(path.join(dir,'../migrations',name),'utf8'));await c.query('commit');}
  catch(e){await c.query('rollback');throw e;}finally{c.release();}
 }
 await test('incremental migration preserves legacy history and defaults existing timezone to UTC',async()=>{
  const r=(await as(A,'select * from public.relationships where id=$1',[rid]))[0];
  assert.equal(r.timezone,'UTC');assert.equal((await db.query('select id from public.garden_events where id=$1',[oldEvent])).rowCount,1);
  assert.equal((await as(A,'select * from public.root_preferences')).length,1);
 });
 await test('membership helper permits own shared data and denies unrelated membership',async()=>{
  assert.equal((await as(A,'select * from public.relationship_members')).length,1);
  assert.equal((await as(C,'select * from public.relationship_members')).length,0);
  assert.equal((await as(C,'select * from public.relationships where id=$1',[rid])).length,0);
 });
 await test('issuance is idempotent under concurrent requests',async()=>{
  const values=await Promise.all([rpc(A,'get_or_create_today_assignment',[0]),rpc(A,'get_or_create_today_assignment',[0])]);
  assert.equal(values[0].id,values[1].id);a0=values[0];assert.equal(a0.program_day,9);assert.equal(a0.user_id,A);
 });
 await test('bonus cannot be issued before primary completion; invalid slots rejected',async()=>{
  await fail(()=>rpc(A,'get_or_create_today_assignment',[1]),'previous_slot_not_completed');
  await fail(()=>rpc(A,'get_or_create_today_assignment',[3]),'invalid_slot');
  await fail(()=>rpc(A,'get_or_create_today_assignment',[null],['integer']),'invalid_slot');
 });
 await test('own invitation rejected without changing membership',async()=>{
  invite=await rpc(A,'create_relationship_invite');await fail(()=>rpc(A,'accept_relationship_invite',[invite]),'own_invite');
 });
 await test('anonymous invite preview discloses only chosen name and state',async()=>{
  await as(A,'update public.profiles set display_name=$1 where id=$2',['Test inviter',A]);
  const rows=await as(null,'select * from public.preview_relationship_invite($1)',[invite],'anon');
  assert.deepEqual(rows,[{invite_state:'ready',display_name:'Test inviter'}]);
  assert.deepEqual(await as(null,'select * from public.preview_relationship_invite($1)',['bad'],'anon'),[{invite_state:'invalid',display_name:null}]);
  await fail(()=>as(null,'select * from public.relationship_invites',[],'anon'),'permission denied');
  await fail(()=>as(null,'select * from public.profiles',[],'anon'),'permission denied');
 });
 await test('invite accepts concurrently and repeated success resolves to same relationship',async()=>{
  const result=await Promise.all([rpc(B,'accept_relationship_invite',[invite]),rpc(B,'accept_relationship_invite',[invite])]);
  assert.deepEqual(result,[rid,rid]);assert.equal(await rpc(B,'accept_relationship_invite',[invite]),rid);
  assert.equal((await as(B,"select member_role from public.relationship_members where user_id=$1",[B]))[0].member_role,'member_b');
 });
 await test('successful acceptance retry remains safe after original expiry',async()=>{
  await db.query('update public.relationship_invites set expires_at=now()-interval \'1 day\' where accepted_by=$1',[B]);
  assert.equal(await rpc(B,'accept_relationship_invite',[invite]),rid);
 });
 await test('joining partner gets current day, distinct task, no pre-join assignments',async()=>{
  b0=await rpc(B,'get_or_create_today_assignment',[0]);assert.equal(b0.program_day,9);
  assert.notEqual(b0.task_key,a0.task_key);assert.equal(b0.user_id,B);
  assert.equal((await as(B,'select * from public.task_assignments')).length,1);
 });
 await test('A cannot read B assignment by ID, listing or relationship filter',async()=>{
  assert.equal((await as(A,'select * from public.task_assignments where id=$1',[b0.id])).length,0);
  assert((await as(A,'select * from public.task_assignments where relationship_id=$1',[rid])).every(x=>x.user_id===A));
 });
 await test('B cannot read A assignment or raw Roots preferences',async()=>{
  assert.equal((await as(B,'select * from public.task_assignments where id=$1',[a0.id])).length,0);
  assert.equal((await as(B,'select * from public.root_preferences where user_id=$1',[A])).length,0);
 });
 await test('direct writes and internal catalogue/seed access are denied',async()=>{
  await fail(()=>as(A,"update public.task_assignments set status='completed' where id=$1",[a0.id]),'permission denied');
  await fail(()=>as(A,'select * from private.task_catalogue'),'permission denied');
  await fail(()=>as(A,'select * from private.relationship_secrets'),'permission denied');
  await fail(()=>as(A,'insert into public.relationship_members(relationship_id,user_id,member_role) values($1,$2,\'member_b\')',[rid,C]),'permission denied');
  await fail(()=>rpc(B,'complete_assignment',[a0.id]),'assignment_not_found');
 });
 await test('Roots mutation and overlap oracle are unavailable',async()=>{
  await fail(()=>as(A,"insert into public.root_preferences(relationship_id,user_id,week_no,need) values($1,$2,2,'fun')",[rid,A]),'permission denied');
  await fail(()=>rpc(A,'refresh_shared_root_insights',[rid,2]),'permission denied');
  await fail(()=>as(A,'select * from public.shared_insights'),'permission denied');
 });
 await test('concurrent/repeated completion creates exactly one consequence and returns no event identifier',async()=>{
  assert.deepEqual(await Promise.all([rpc(A,'complete_assignment',[a0.id]),rpc(A,'complete_assignment',[a0.id])]),[null,null]);
  assert.equal(await rpc(A,'complete_assignment',[a0.id]),null);
  assert.equal((await db.query('select count(*)::int as n from public.garden_events where source_assignment_id=$1',[a0.id])).rows[0].n,1);
 });
 await test('shared garden is anonymous daily totals; A/B match, C sees none',async()=>{
  const ga=await as(A,'select * from public.get_shared_garden()');const gb=await as(B,'select * from public.get_shared_garden()');
  assert.deepEqual(ga,gb);assert.equal(ga.length,2);
  assert.deepEqual(Object.keys(ga[0]).sort(),['flower_count','garden_date']);
  assert.equal((await as(C,'select * from public.get_shared_garden()')).length,0);
  for(const u of [A,B,C])await fail(()=>as(u,'select id,created_by,source_assignment_id,created_at from public.garden_events'),'permission denied');
  assert.equal((await db.query("select has_table_privilege('authenticated','public.garden_events','SELECT') as ok")).rows[0].ok,false);
 });
 await test('three slots complete, fourth is rejected, retries do not consume quota',async()=>{
  for(const slot of [1,2]){const a=await rpc(A,'get_or_create_today_assignment',[slot]);assert.equal(a.program_day,9);await rpc(A,'complete_assignment',[a.id,'leak:task-key']);}
  await fail(()=>rpc(A,'get_or_create_today_assignment',[3]),'invalid_slot');
  assert.equal(await rpc(A,'complete_assignment',[a0.id]),null);
  const row=(await db.query("select count(*)::int as n from public.task_assignments where user_id=$1 and status='completed' and (completed_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date",[A])).rows[0];assert.equal(row.n,3);
  assert.equal((await db.query("select count(*)::int as n from public.garden_events where plant_type<>'flower'")).rows[0].n,0);
 });
 await test('member caps hold and third user cannot reuse consumed invite',async()=>{
  await fail(()=>rpc(C,'accept_relationship_invite',[invite]),'invite_already_used');
  await assert.rejects(()=>db.query("insert into public.relationship_members(relationship_id,user_id,member_role) values($1,$2,'member_b')",[rid,C]),e=>e.code==='23505');
  assert.equal((await as(A,'select * from public.relationship_members')).length,2);
 });
 await test('expired and revoked invitations fail',async()=>{
  const rd=await rpc(D,'create_solo_relationship');const expired=await rpc(D,'create_relationship_invite');
  await db.query("update public.relationship_invites set expires_at=now()-interval '1 second' where relationship_id=$1",[rd]);
  await fail(()=>rpc(E,'accept_relationship_invite',[expired]),'invite_expired');
  const revoked=await rpc(D,'create_relationship_invite');await rpc(D,'create_relationship_invite');
  await fail(()=>rpc(E,'accept_relationship_invite',[revoked]),'invite_revoked');
  await fail(()=>rpc(E,'accept_relationship_invite',['bad']),'invalid_invite');
 });
 await test('second active relationship rejected and create retry preserves existing relationship',async()=>{
  await rpc(F,'create_solo_relationship');const otherInvite=await rpc(F,'create_relationship_invite');
  await fail(()=>rpc(A,'accept_relationship_invite',[otherInvite]),'already_in_relationship');
  assert.equal(await rpc(A,'create_solo_relationship'),rid);
  const rf=await rpc(F,'create_solo_relationship');
  await assert.rejects(()=>db.query("insert into public.relationship_members(relationship_id,user_id,member_role) values($1,$2,'member_b')",[rf,A]),e=>e.code==='23505');
 });
 await test('concurrent invite generation revokes all but one unused token',async()=>{
  const rg=await rpc(G,'create_solo_relationship');await Promise.all([rpc(G,'create_relationship_invite'),rpc(G,'create_relationship_invite')]);
  assert.equal((await db.query('select count(*)::int as n from public.relationship_invites where relationship_id=$1 and accepted_at is null and revoked_at is null',[rg])).rows[0].n,1);
 });
 await test('two contenders cannot create third member',async()=>{
  const token=await rpc(G,'create_relationship_invite');const result=await Promise.allSettled([rpc(H,'accept_relationship_invite',[token]),rpc(I,'accept_relationship_invite',[token])]);
  assert.equal(result.filter(x=>x.status==='fulfilled').length,1);assert.equal(result.filter(x=>x.status==='rejected').length,1);
 });
 await test('timezone supplied at creation and invalid timezone rejected',async()=>{
  const rj=await rpc(J,'create_solo_relationship',['Pacific/Kiritimati'],['text']);
  const row=(await as(J,'select * from public.relationships'))[0];assert.equal(row.timezone,'Pacific/Kiritimati');
  const task=await rpc(J,'get_or_create_today_assignment',[0]);assert.equal(task.program_day,1);
  const expected=(await db.query("select ((statement_timestamp() at time zone 'Pacific/Kiritimati')::date)::text as d")).rows[0].d;
  assert.equal(task.assigned_for_date,expected);
  await fail(()=>rpc(K,'create_solo_relationship',['Not/AZone'],['text']),'invalid_timezone');
 });
 await test('path completion stops issuance but preserves garden access',async()=>{
  await db.query('update public.relationships set path_started_at=current_date-28 where id=$1',[rid]);
  await fail(()=>rpc(B,'get_or_create_today_assignment',[0]),'path_not_available');
  assert.equal((await as(B,'select * from public.get_shared_garden()')).length,2);
  assert.equal(await rpc(A,'complete_assignment',[a0.id]),null);
  await db.query('update public.relationships set path_started_at=current_date-8 where id=$1',[rid]);
 });
 await test('legacy unfinished, stale and skipped assignments cannot complete',async()=>{
  const legacy=(await db.query("insert into public.task_assignments(relationship_id,user_id,task_key,assigned_for_date) values($1,$2,'legacy-unfinished',current_date) returning id",[rid,B])).rows[0].id;
  await fail(()=>rpc(B,'complete_assignment',[legacy]),'legacy_assignment_read_only');
  await db.query("update public.task_assignments set status='skipped' where id=$1",[b0.id]);
  await fail(()=>rpc(B,'complete_assignment',[b0.id]),'assignment_not_eligible');
  await db.query("update public.task_assignments set status='assigned',assigned_for_date=current_date-1 where id=$1",[b0.id]);
  await fail(()=>rpc(B,'complete_assignment',[b0.id]),'assignment_not_eligible');
 });
 await test('no session/no membership cannot issue or complete',async()=>{
  await fail(()=>rpc(null,'get_or_create_today_assignment',[0]),'not_authenticated');
  await fail(()=>rpc(C,'get_or_create_today_assignment',[0]),'no_active_relationship');
  await fail(()=>as(null,'select * from public.get_shared_garden()',[],'anon'),'permission denied');
 });
 await test('solo history and path survive joining',async()=>{
  assert.equal((await db.query('select id from public.garden_events where id=$1',[oldEvent])).rowCount,1);
  assert.equal((await as(A,'select id from public.task_assignments where id=$1',[oldAssignment])).length,1);
  assert.equal((await as(A,'select * from public.root_preferences')).length,1);
  assert.equal((await as(B,'select id from public.relationships'))[0].id,rid);
 });
 await test('legacy completions count toward daily cap and failed completion is atomic',async()=>{
  const rl=await rpc(L,'create_solo_relationship');const task=await rpc(L,'get_or_create_today_assignment',[0]);
  await db.query("insert into public.task_assignments(relationship_id,user_id,task_key,assigned_for_date,status,completed_at) select $1,$2,'legacy-cap-'||n,current_date,'completed',now() from generate_series(1,3)n",[rl,L]);
  await fail(()=>rpc(L,'complete_assignment',[task.id]),'daily_limit_reached');
  assert.equal((await as(L,'select status from public.task_assignments where id=$1',[task.id]))[0].status,'assigned');
  assert.equal((await as(L,'select * from public.get_shared_garden()')).length,0);
 });
 await test('pre-membership assignments and departed members cannot complete',async()=>{
  await db.query("update public.task_assignments set status='assigned',assigned_for_date=current_date,created_at=now()-interval '2 days' where id=$1",[b0.id]);
  await fail(()=>rpc(B,'complete_assignment',[b0.id]),'assignment_not_eligible');
  await db.query('update public.relationship_members set left_at=now() where user_id=$1',[B]);
  await fail(()=>rpc(B,'complete_assignment',[b0.id]),'relationship_not_active');
  assert.equal((await as(B,'select * from public.get_shared_garden()')).length,0);
 });
 await test('concurrent joins to different relationships give one winner',async()=>{
  const [t1,t2]=await Promise.all([rpc(D,'create_relationship_invite'),rpc(F,'create_relationship_invite')]);
  const result=await Promise.allSettled([rpc(E,'accept_relationship_invite',[t1]),rpc(E,'accept_relationship_invite',[t2])]);
  assert.equal(result.filter(x=>x.status==='fulfilled').length,1);
  assert.equal((await as(E,'select * from public.relationship_members where user_id=$1',[E])).length,1);
 });
 for(const name of migrations.filter(x=>x.includes('private_roots_checkin'))) {
  const c=await db.connect();try {await c.query('begin');await c.query(await readFile(path.join(dir,'../migrations',name),'utf8'));await c.query('commit');}
  catch(e){await c.query('rollback');throw e;}finally{c.release();}
 }
 const ra=randomUUID(),rb=randomUUID(),rc=randomUUID();
 await db.query("insert into auth.users(id,raw_user_meta_data) select unnest($1::uuid[]),'{}'::jsonb",[[ra,rb,rc]]);
 const rr=await rpc(ra,'create_solo_relationship',['Pacific/Kiritimati']);
 const roots=u=>rpc(u,'get_my_root_preferences');
 const saveRoots=(u,choices)=>rpc(u,'save_my_root_preferences',[choices],['text[]']);
 await test('Roots saves one/two choices; retry preserves rows; replacement is current-period only',async()=>{
  assert.deepEqual(await roots(ra),{choices:[],can_edit:true});
  assert.deepEqual(await saveRoots(ra,['fun']),{choices:['fun'],can_edit:true});
  const before=await as(ra,'select id,created_at from public.root_preferences');
  await saveRoots(ra,['fun']);assert.deepEqual(await as(ra,'select id,created_at from public.root_preferences'),before);
  assert.deepEqual(await saveRoots(ra,['fun','conversation']),{choices:['conversation','fun'],can_edit:true});
  await saveRoots(ra,['attention']);assert.deepEqual(await roots(ra),{choices:['attention'],can_edit:true});
  assert.equal((await as(ra,'select * from public.root_preferences')).length,1);
 });
 await test('Roots rejects empty/duplicate/unknown/malformed choices and has no owner/relationship arguments',async()=>{
  for(const choices of [[],null,['fun','fun'],['fun','support','affection'],['other'],['Fun'],[null],[['fun']]]) await fail(()=>saveRoots(ra,choices),'invalid_root_choices');
  assert.equal((await db.query("select pg_get_function_arguments('public.save_my_root_preferences(text[])'::regprocedure) args")).rows[0].args,'choices text[]');
  await fail(()=>saveRoots(rc,['fun']),'no_active_relationship');
  await fail(()=>as(null,"select public.save_my_root_preferences(array['fun'])",[],'anon'),'permission denied');
 });
 await test('Roots isolates both partners, denies direct writes and keeps shared derivation disabled',async()=>{
  await rpc(rb,'accept_relationship_invite',[await rpc(ra,'create_relationship_invite')]);
  await saveRoots(rb,['affection']);
  assert.equal((await as(ra,'select * from public.root_preferences where user_id=$1',[rb])).length,0);
  assert.equal((await as(rb,'select * from public.root_preferences where user_id=$1',[ra])).length,0);
  for(const choice of ['affection','fun','conversation']) assert.deepEqual(await saveRoots(ra,[choice]),{choices:[choice],can_edit:true});
  assert.deepEqual(await roots(rb),{choices:['affection'],can_edit:true});
  await fail(()=>as(ra,"insert into public.root_preferences(relationship_id,user_id,week_no,need) values($1,$2,1,'fun')",[rr,ra]),'permission denied');
  await fail(()=>as(ra,"update public.root_preferences set need='fun'"),'permission denied');
  await fail(()=>as(ra,'delete from public.root_preferences'),'permission denied');
  await fail(()=>as(ra,'select * from public.shared_insights'),'permission denied');
  await fail(()=>rpc(ra,'refresh_shared_root_insights',[rr,1]),'permission denied');
 });
 await test('Roots concurrent replacements stay atomic and contain at most two choices',async()=>{
  await Promise.all([saveRoots(ra,['fun','support']),saveRoots(ra,['conversation','affection']),saveRoots(ra,['fun','support'])]);
  const result=await roots(ra);
  assert.ok([JSON.stringify(['fun','support']),JSON.stringify(['affection','conversation'])].includes(JSON.stringify(result.choices)));
  assert.equal((await as(ra,'select * from public.root_preferences')).length,2);
 });
 await test('Roots uses relationship-local week, preserves history and closes writes after Routine',async()=>{
  await db.query("update public.relationships set path_started_at=(now() at time zone timezone)::date-7 where id=$1",[rr]);
  assert.deepEqual(await roots(ra),{choices:[],can_edit:true});
  await saveRoots(ra,['support']);
  assert.equal((await as(ra,"select week_no from public.root_preferences where need='support' and week_no=2"))[0].week_no,2);
  await db.query("update public.relationships set path_started_at=(now() at time zone timezone)::date-21 where id=$1",[rr]);
  await saveRoots(ra,['fun']);
  await db.query("update public.relationships set path_started_at=(now() at time zone timezone)::date-28 where id=$1",[rr]);
  assert.deepEqual(await roots(ra),{choices:['fun'],can_edit:false});
  await fail(()=>saveRoots(ra,['support']),'roots_period_not_available');
  assert.ok((await as(ra,'select * from public.root_preferences')).length>=4);
 });
 for (const name of migrations.filter(x=>x.includes('shared_flower_private_reflections'))) await db.query(await readFile(path.join(dir,'../migrations',name),'utf8'));
 await test('creator alone chooses once; both members inherit choice and growth history remains',async()=>{
  const before=(await db.query('select count(*)::int n from public.garden_events')).rows[0].n;
  await fail(()=>rpc(rb,'choose_shared_flower',['daisy']),'only_creator_can_choose');
  await fail(()=>rpc(ra,'choose_shared_flower',['invalid']),'invalid_flower');
  assert.equal(await rpc(ra,'choose_shared_flower',['cosmos']),'cosmos');
  assert.equal(await rpc(ra,'choose_shared_flower',['cosmos']),'cosmos');
  await fail(()=>rpc(ra,'choose_shared_flower',['zinnia']),'flower_already_chosen');
  assert.equal((await as(rb,'select selected_flower from public.relationships where id=$1',[rr]))[0].selected_flower,'cosmos');
  assert.equal((await as(rc,'select selected_flower from public.relationships where id=$1',[rr])).length,0);
  await fail(()=>as(rb,"update public.relationships set selected_flower='daisy'"),'permission denied');
  assert.equal((await db.query('select count(*)::int n from public.garden_events')).rows[0].n,before);
 });
 const reflection=u=>rpc(u,'get_my_daily_reflection');
 const keep=(u,t)=>rpc(u,'save_my_daily_reflection',[t]);
 await test('private reflection creates once, edits, uses server relationship date and rejects invalid length',async()=>{
  const first=await reflection(ra); assert.equal(first.text,null);
  assert.equal(first.date,(await db.query("select to_char((now() at time zone timezone)::date,'YYYY-MM-DD') d from public.relationships where id=$1",[rr])).rows[0].d);
  assert.equal((await keep(ra,'An ordinary happy moment.')).text,'An ordinary happy moment.');
  await Promise.all([keep(ra,'Updated thought.'),keep(ra,'Updated thought.')]);
  assert.equal((await reflection(ra)).text,'Updated thought.');
  assert.equal((await as(ra,'select * from public.daily_reflections')).length,1);
  for(const bad of ['',null,'   ','x'.repeat(281)]) await fail(()=>keep(ra,bad),'invalid_reflection');
  await keep(ra,'x'.repeat(280));
 });
 await test('reflection text/existence/timestamps private in both directions; direct writes and anon blocked',async()=>{
  assert.equal((await reflection(rb)).text,null);
  await keep(rb,'Only B sees this.');
  assert.equal((await as(ra,'select * from public.daily_reflections where user_id=$1',[rb])).length,0);
  assert.equal((await as(rb,'select * from public.daily_reflections where user_id=$1',[ra])).length,0);
  assert.equal((await as(rc,'select * from public.daily_reflections')).length,0);
  await fail(()=>keep(rc,'No membership'),'no_active_relationship');
  await fail(()=>rpc(null,'get_my_daily_reflection'),'not_authenticated');
  await fail(()=>as(null,'select * from public.daily_reflections',[],'anon'),'permission denied');
  for(const sql of ["update public.daily_reflections set body='changed'",'delete from public.daily_reflections',"insert into public.daily_reflections(user_id,relationship_id,reflection_date,body) values('"+ra+"','"+rr+"',current_date,'bad')"]) await fail(()=>as(ra,sql),'permission denied');
  const garden=await as(rb,'select * from public.get_shared_garden()');
  for(const row of garden) assert.deepEqual(Object.keys(row).sort(),['flower_count','garden_date']);
 });


 // Create a pre-migration relationship whose B member must be able to resolve
 // the missing flower, without changing path, membership or historical rows.
 const la=randomUUID(),lb=randomUUID(),lc=randomUUID();
 await db.query("insert into auth.users(id,raw_user_meta_data) select unnest($1::uuid[]),'{}'::jsonb",[[la,lb,lc]]);
 const lr=await rpc(la,'create_solo_relationship');
 await rpc(lb,'accept_relationship_invite',[await rpc(la,'create_relationship_invite')]);
 await db.query("insert into public.garden_events(relationship_id,created_by,plant_type) select $1,$2,'flower' from generate_series(1,7)",[lr,la]);
 const beforeLegacy=(await db.query('select path_started_at from public.relationships where id=$1',[lr])).rows[0];
 for (const name of migrations.filter(x=>x.includes('legacy_flower_choice'))) {
  const c=await db.connect();try { await c.query('begin'); await c.query(await readFile(path.join(dir,'../migrations',name),'utf8')); await c.query('commit'); }
  catch(e){await c.query('rollback');throw e;}finally{c.release();}
 }
 await test('legacy B can choose once; seven moments and path survive; retry and outsider isolation',async()=>{
  assert.equal((await as(lb,'select legacy_flower_choice from public.relationships where id=$1',[lr]))[0].legacy_flower_choice,true);
  await fail(()=>rpc(lc,'choose_shared_flower',['cosmos']),'no_active_relationship');
  assert.equal(await rpc(lb,'choose_shared_flower',['cosmos']),'cosmos');
  assert.equal(await rpc(lb,'choose_shared_flower',['cosmos']),'cosmos');
  await fail(()=>rpc(la,'choose_shared_flower',['zinnia']),'flower_already_chosen');
  assert.equal((await as(la,'select selected_flower from public.relationships where id=$1',[lr]))[0].selected_flower,'cosmos');
  assert.equal((await as(lb,'select * from public.get_shared_garden()')).reduce((sum,d)=>sum+Number(d.flower_count),0),7);
  assert.deepEqual((await db.query('select path_started_at from public.relationships where id=$1',[lr])).rows[0],beforeLegacy);
  assert.equal((await as(lb,'select legacy_flower_choice from public.relationships where id=$1',[lr]))[0].legacy_flower_choice,false);
  await fail(()=>as(lb,'update public.relationships set legacy_flower_choice=true'),'permission denied');
 });
 await test('fresh relationship remains starter-only; concurrent legacy choices have one winner',async()=>{
  const fresh=await rpc(lc,'create_solo_relationship');
  const ld=randomUUID(); await db.query("insert into auth.users(id,raw_user_meta_data) values($1,'{}')",[ld]);
  await rpc(ld,'accept_relationship_invite',[await rpc(lc,'create_relationship_invite')]);
  assert.equal((await as(ld,'select legacy_flower_choice from public.relationships where id=$1',[fresh]))[0].legacy_flower_choice,false);
  await fail(()=>rpc(ld,'choose_shared_flower',['daisy']),'only_creator_can_choose');
  await rpc(lc,'choose_shared_flower',['daisy']);
  // Set up a separate local legacy fixture; never reset live user data.
  await db.query('update public.relationships set selected_flower=null,legacy_flower_choice=true where id=$1',[lr]);
  const result=await Promise.allSettled([rpc(la,'choose_shared_flower',['cosmos']),rpc(lb,'choose_shared_flower',['zinnia'])]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
  assert.match(result.find(r=>r.status==='rejected').reason.message,/flower_already_chosen/);
  assert.equal((await as(lb,'select * from public.get_shared_garden()')).reduce((sum,d)=>sum+Number(d.flower_count),0),7);
  await db.query('update public.relationship_members set left_at=now() where user_id=$1',[lb]);
  await fail(()=>rpc(lb,'choose_shared_flower',['cosmos']),'no_active_relationship');
 });

 console.log(`PASS ${passed} test groups; database=${database}; PostgreSQL=${(await db.query('show server_version')).rows[0].server_version}`);
}finally{await db.end();}
