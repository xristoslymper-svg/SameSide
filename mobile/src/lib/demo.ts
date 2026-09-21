import { Platform } from 'react-native';
const hostAllowsDemo = Platform.OS === 'web' && typeof window !== 'undefined'
 && (['localhost','127.0.0.1','[::1]'].includes(window.location.hostname)
   || window.location.hostname === 'same-side.vercel.app'
   || window.location.hostname.endsWith('.vercel.app'));
export const demoAvailable = hostAllowsDemo && process.env.EXPO_PUBLIC_ENABLE_DEMO === 'true';
const prefix = 'same-side.demo.';
if (demoAvailable && new URLSearchParams(window.location.search).get('demo') === '1') window.sessionStorage.setItem(prefix+'active','1');
export const isDemo = demoAvailable && window.sessionStorage.getItem(prefix+'active') === '1';
export const demoUserId = '00000000-0000-4000-8000-00000000d001';
const relationshipId = '00000000-0000-4000-8000-00000000d002';
export const demoToken = 'd'.repeat(64);
export type DemoScenario = 'fresh' | 'solo' | 'paired' | 'legacy' | 'week3' | 'bloom';
type State = { relationship: boolean; members: number; name: string; partnerName:string; departed:boolean; flower: string | null; legacy: boolean; day: number; today: string; start: string; daily: Record<string,number>; moves: Record<string, any>; roots: string[]; thought: string | null; physical:'growing'|'ready_to_plant'|'planted'|'photo_ready' };
const date = (offset=0) => new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
const initial = ():State => ({relationship:false,members:1,name:'Alex',partnerName:'Sam',departed:false,flower:null,legacy:false,day:1,today:date(),start:date(),daily:{},moves:{},roots:[],thought:null,physical:'growing'});
function read():State { try { const value=window.sessionStorage.getItem(prefix+'data'); return value?{...initial(),...JSON.parse(value)}:initial(); } catch {return initial();} }
export const demoToday = () => read().today;
function write(state:State) { window.sessionStorage.setItem(prefix+'data',JSON.stringify(state)); }
function activeDays(state:State){return Object.values(state.daily).filter(value=>value>0).length;}
function gardenStage(state:State) {
 const active=activeDays(state);
 const stage_key=active>=28?'bloom':active>=24?'opening':active>=18?'bud':active>=12?'established':active>=7?'leaves':active>=3?'shoot':active>=1?'roots':'seed';
 return {stage_key,bloom:stage_key==='bloom',programme_complete:active>=28};
}
export function startDemo(scenario:DemoScenario='fresh') {
 if(!demoAvailable)return;
 for(const key of Object.keys(window.sessionStorage)) if(key.startsWith(prefix)) window.sessionStorage.removeItem(key);
 window.sessionStorage.setItem(prefix+'active','1');
 const state=initial();
 if(scenario!=='fresh') {
  state.relationship=true; state.members=scenario==='solo'?1:2;
  state.day=scenario==='week3'?21:scenario==='bloom'?28:7;
  state.start=date(1-state.day);state.flower=scenario==='legacy'?null:'cosmos';state.legacy=scenario==='legacy';
  for(let i=0;i<state.day;i++)state.daily[date(i+1-state.day)]=1;
  if(scenario==='bloom')state.physical='ready_to_plant';
  state.moves['0']={id:'demo-move-0',slot:0,assigned_for_date:state.today,program_day:Math.min(activeDays(state),28),task_title:'Notice one specific effort',task_body:'Tell your partner one ordinary thing they did that you appreciated. Be specific.',task_why:'Routine makes familiar effort easy to stop seeing. Naming one concrete thing trains your attention back toward what your partner is already bringing into the relationship.',task_minutes:2,status:'completed'};
  window.sessionStorage.setItem(prefix+'app.same-side.demo.auth',JSON.stringify(demoSession()));
  window.sessionStorage.setItem(prefix+'app.same-side.onboarding.v1.'+demoUserId,JSON.stringify({version:1,step:'done',intent:state.members===2?'together':'solo',path:'routine',focus:[]}));
 }
 write(state);window.location.assign(scenario==='fresh'?'/?demo=1':'/garden?demo=1');
}
export function exitDemo() {
 if(!demoAvailable)return;
 for(const key of Object.keys(window.sessionStorage)) if(key.startsWith(prefix))window.sessionStorage.removeItem(key);
 window.location.assign('/');
}
export const demoStorage = {
 async getItem(key:string) {return window.sessionStorage.getItem(prefix+'app.'+key);},
 async setItem(key:string,value:string) {window.sessionStorage.setItem(prefix+'app.'+key,value);},
 async removeItem(key:string) {window.sessionStorage.removeItem(prefix+'app.'+key);},
};
export function demoSession() {
 const exp=Math.floor(Date.now()/1000)+3600;
 const encode=(v:unknown)=>btoa(JSON.stringify(v)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
 return {access_token:`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:demoUserId,exp,role:'authenticated'})}.demo-only`,refresh_token:'demo-only',token_type:'bearer',expires_in:3600,expires_at:exp,user:{id:demoUserId,email:'tester@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}};
}
export const demoFetch: typeof fetch = async (input,init) => {
 if(!isDemo)throw new Error('Demo transport is unavailable.');
 const req=new Request(input,init); const url=new URL(req.url);
 const state=read();const raw=await req.text();const body=raw?JSON.parse(raw):{};
 const reply=(value:unknown,status=200,headers:Record<string,string>={})=>new Response(status===204||req.method==='HEAD'?null:JSON.stringify(value),{status,headers:{'content-type':'application/json',...headers}});
 const rows=(value:unknown[])=>reply(req.headers.get('accept')?.includes('vnd.pgrst.object')?value[0]??null:value);
 if(url.pathname.startsWith('/auth/v1/')) {
  if(url.pathname.endsWith('/logout'))return reply(null,204);
  if(url.pathname.endsWith('/user'))return reply(demoSession().user);
  if(url.pathname.endsWith('/token'))return reply(demoSession());
  return reply({message:'Use the demo continue button. No email is sent.'},400);
 }
 if(url.pathname.endsWith('/relationship_members'))return req.method==='HEAD'?reply(null,200,{'content-range':`0-${Math.max(0,state.members-1)}/${state.members}`}):rows(state.relationship?[{relationship_id:relationshipId,member_role:'member_a',user_id:demoUserId}]:[]);
 if(url.pathname.endsWith('/relationships'))return rows(state.relationship?[{id:relationshipId,active_path:'routine',selected_flower:state.flower,legacy_flower_choice:state.legacy,path_started_at:state.start,timezone:'UTC'}]:[]);
 if(url.pathname.endsWith('/profiles')) {state.name=body.display_name??state.name;write(state);return reply(null,204);}
 if(url.pathname.endsWith('/task_assignments'))return rows(Object.values(state.moves).sort((a,b)=>b.slot-a.slot).slice(0,1));
 const rpc=url.pathname.split('/rpc/')[1]; let result:unknown;
 switch(rpc) {
  case 'create_solo_relationship':state.relationship=true;state.members=1;result=relationshipId;break;
  case 'create_relationship_invite':if(state.departed)return reply({message:'relationship_closed'},400);result=demoToken;break;
  case 'revoke_relationship_invites':result=null;break;
  case 'preview_relationship_invite':result=[{invite_state:'ready',display_name:state.name}];break;
  case 'accept_relationship_invite':state.members=2;state.relationship=true;result=relationshipId;break;
  case 'get_relationship_overview':result=state.relationship?[{relationship_id:relationshipId,my_role:'member_a',active_member_count:state.members,partner_name:state.members===2||state.departed?state.partnerName:null,partner_active:state.members===2,has_departure:state.departed,my_joined_at:new Date().toISOString(),my_joined_day:1,partner_joined_at:state.members===2?new Date().toISOString():null}]:[];break;
  case 'leave_relationship':state.relationship=false;state.members=0;result=relationshipId;break;
  case 'get_physical_garden_state':result=[{status:state.physical,batch:state.physical==='growing'?null:'September 2026',planted_at:state.physical==='planted'||state.physical==='photo_ready'?new Date().toISOString():null,photo_url:null}];break;
  case 'choose_shared_flower':
   if(state.flower&&state.flower!==body.flower)return reply({message:'flower_already_chosen'},400);
   state.flower=body.flower;state.legacy=false;result=state.flower;break;
  case 'get_or_create_today_assignment': {
   const slot=body.requested_slot??0;
   if(!Number.isInteger(slot)||slot<0||slot>2)return reply({message:'daily_limit_reached'},400);
   if(slot&&state.moves[slot-1]?.status!=='completed')return reply({message:'previous_slot_not_completed'},400);
   const active=activeDays(state); if(active>=28)return reply({message:'path_complete'},400);
   const programDay=Math.min(active+1,28); const step=Math.min(4,Math.max(1,Math.ceil(programDay/7)));
   const samples=[
    {title:'Notice one specific effort',body:'Tell your partner one ordinary thing they did that you appreciated. Be specific.',why:'Routine makes familiar effort easy to stop seeing. Naming one concrete thing trains your attention back toward what your partner is already bringing into the relationship.'},
    {title:'Make a tiny invitation',body:'Invite your partner into ten minutes together: tea, a short walk, music, or something equally simple.',why:'Routine stays powerful when nothing interrupts it. A small invitation creates a new shared moment without needing a special occasion.'},
    {title:'Ask instead of assuming',body:'If your partner seems off today, ask how they are rather than deciding what their mood means.',why:'Assumptions can turn uncertainty into distance. A simple question replaces guessing with real information.'},
    {title:'Repeat something that worked',body:'Think of one move from this journey that felt good between you and do a version of it again today.',why:'A good moment becomes useful when it can be repeated. Choosing something that worked helps turn a success into a pattern.'},
   ];
   const sample=samples[step-1];
   state.moves[slot]??={id:'demo-move-'+slot,slot,assigned_for_date:state.today,program_day:programDay,task_title:sample.title,task_body:sample.body,task_why:sample.why,task_minutes:3,status:'assigned'};
   result=state.moves[slot];break;
  }
  case 'complete_assignment': {
   const move=Object.values(state.moves).find(m=>m.id===body.assignment_id);
   if(!move)return reply({message:'assignment_not_eligible'},400);
   if(move.status!=='completed'){move.status='completed';state.daily[state.today]=(state.daily[state.today]??0)+1;}
   result=null;break;
  }
  case 'get_shared_garden_state':result=[gardenStage(state)];break;
  case 'get_my_root_pulse':result={pattern:state.roots[0]??null,target:state.roots[1]??null,can_edit:true,week_no:Math.min(4,Math.max(1,Math.ceil(Math.max(1,state.day)/7)))};break;
  case 'save_my_root_pulse':state.roots=[body.pattern,body.target];result={pattern:body.pattern,target:body.target,can_edit:true,week_no:Math.min(4,Math.max(1,Math.ceil(Math.max(1,state.day)/7)))};break;
  case 'get_my_root_preferences':result={choices:state.roots,can_edit:true};break;
  case 'save_my_root_preferences':state.roots=body.choices;result={choices:state.roots,can_edit:true};break;
  case 'get_my_daily_reflection':result={date:state.today,text:state.thought};break;
  case 'save_my_daily_reflection':state.thought=body.thought;result={date:state.today,text:state.thought};break;
  default:return reply({message:'This operation is not supported in the isolated demo.'},400);
 }
 write(state);return reply(result);
};