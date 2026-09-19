import { Platform } from 'react-native';
// Loopback-only, explicitly enabled web testing. No real client/network fallback.
export const demoAvailable = Platform.OS === 'web' && typeof window !== 'undefined'
 && ['localhost','127.0.0.1','[::1]'].includes(window.location.hostname)
 && process.env.EXPO_PUBLIC_ENABLE_DEMO === 'true';
const prefix = 'same-side.demo.';
if (demoAvailable && new URLSearchParams(window.location.search).get('demo') === '1') window.sessionStorage.setItem(prefix+'active','1');
export const isDemo = demoAvailable && window.sessionStorage.getItem(prefix+'active') === '1';
export const demoUserId = '00000000-0000-4000-8000-00000000d001';
const relationshipId = '00000000-0000-4000-8000-00000000d002';
export const demoToken = 'd'.repeat(64);
export type DemoScenario = 'fresh' | 'solo' | 'paired' | 'legacy' | 'week3' | 'bloom';
type State = { relationship: boolean; members: number; name: string; flower: string | null; legacy: boolean; day: number; today: string; start: string; daily: Record<string,number>; moves: Record<string, any>; roots: string[]; thought: string | null };
const date = (offset=0) => new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
const initial = ():State => ({relationship:false,members:1,name:'Alex',flower:null,legacy:false,day:1,today:date(),start:date(),daily:{},moves:{},roots:[],thought:null});
function read():State { try { const value=window.sessionStorage.getItem(prefix+'data'); return value?JSON.parse(value):initial(); } catch {return initial();} }
export const demoToday = () => read().today;
function write(state:State) { window.sessionStorage.setItem(prefix+'data',JSON.stringify(state)); }
export function demoSession() {
 const exp=Math.floor(Date.now()/1000)+3600;
 const encode=(v:unknown)=>btoa(JSON.stringify(v)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
 return {access_token:`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:demoUserId,exp,role:'authenticated'})}.demo-only`,refresh_token:'demo-only',token_type:'bearer',expires_in:3600,expires_at:exp,user:{id:demoUserId,email:'tester@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}};
}
export function startDemo(scenario:DemoScenario='fresh') {
 if(!demoAvailable)return;
 // Only this tab's demo namespace is reset. Real localStorage is never touched.
 for(const key of Object.keys(window.sessionStorage)) if(key.startsWith(prefix)) window.sessionStorage.removeItem(key);
 window.sessionStorage.setItem(prefix+'active','1');
 const state=initial();
 if(scenario!=='fresh') {
  state.relationship=true; state.members=scenario==='solo'?1:2;
  state.day=scenario==='week3'?21:scenario==='bloom'?28:7;
  state.start=date(1-state.day);state.flower=scenario==='legacy'?null:'cosmos';state.legacy=scenario==='legacy';
  for(let i=0;i<state.day;i++)state.daily[date(i+1-state.day)]=1;
  if(state.day===7) {state.daily[state.start]=2;state.daily[date(-4)]=2;}
  state.moves['0']={id:'demo-move-0',slot:0,assigned_for_date:state.today,program_day:state.day,task_title:'Notice one small thing',task_body:'Tell your partner one specific thing you appreciated today.',task_minutes:2,status:'completed'};
  window.sessionStorage.setItem(prefix+'app.same-side.demo.auth',JSON.stringify(demoSession()));
  window.sessionStorage.setItem(prefix+'app.same-side.onboarding.v1.'+demoUserId,JSON.stringify({version:1,step:'done',intent:state.members===2?'together':'solo',path:'routine',focus:null}));
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
 if(url.pathname.endsWith('/relationship_members'))return req.method==='HEAD'?reply(null,200,{'content-range':`0-${state.members-1}/${state.members}`}):rows(state.relationship?[{relationship_id:relationshipId,member_role:'member_a',user_id:demoUserId}]:[]);
 if(url.pathname.endsWith('/relationships'))return rows(state.relationship?[{id:relationshipId,active_path:'routine',selected_flower:state.flower,legacy_flower_choice:state.legacy,path_started_at:state.start,timezone:'UTC'}]:[]);
 if(url.pathname.endsWith('/profiles')) {state.name=body.display_name??state.name;write(state);return reply(null,204);}
 if(url.pathname.endsWith('/task_assignments'))return rows(Object.values(state.moves).sort((a,b)=>b.slot-a.slot).slice(0,1));
 const rpc=url.pathname.split('/rpc/')[1]; let result:unknown;
 switch(rpc) {
  case 'create_solo_relationship':state.relationship=true;result=relationshipId;break;
  case 'create_relationship_invite':result=demoToken;break;
  case 'preview_relationship_invite':result=[{invite_state:'ready',display_name:state.name}];break;
  case 'accept_relationship_invite':state.members=2;state.relationship=true;result=relationshipId;break;
  case 'choose_shared_flower':
   if(state.flower&&state.flower!==body.flower)return reply({message:'flower_already_chosen'},400);
   state.flower=body.flower;state.legacy=false;result=state.flower;break;
  case 'get_or_create_today_assignment': {
   const slot=body.requested_slot??0;
   if(!Number.isInteger(slot)||slot<0||slot>2)return reply({message:'daily_limit_reached'},400);
   if(slot&&state.moves[slot-1]?.status!=='completed')return reply({message:'previous_slot_not_completed'},400);
   const titles=['Notice one small thing','Make one thing lighter','Share a warm memory'];
   const descriptions=['Tell your partner one specific thing you appreciated today.','Take care of a little everyday job your partner usually does.','Tell your partner about a small moment together that still makes you smile.'];
   state.moves[slot]??={id:'demo-move-'+slot,slot,assigned_for_date:state.today,program_day:state.day,task_title:titles[slot],task_body:descriptions[slot],task_minutes:2,status:'assigned'};
   result=state.moves[slot];break;
  }
  case 'complete_assignment': {
   const move=Object.values(state.moves).find(m=>m.id===body.assignment_id);
   if(!move)return reply({message:'assignment_not_eligible'},400);
   if(move.status!=='completed'){move.status='completed';state.daily[state.today]=(state.daily[state.today]??0)+1;}
   result=null;break;
  }
  case 'get_shared_garden':result=Object.entries(state.daily).map(([garden_date,flower_count])=>({garden_date,flower_count}));break;
  case 'get_my_root_preferences':result={choices:state.roots,can_edit:true};break;
  case 'save_my_root_preferences':state.roots=body.choices;result={choices:state.roots,can_edit:true};break;
  case 'get_my_daily_reflection':result={date:state.today,text:state.thought};break;
  case 'save_my_daily_reflection':state.thought=body.thought;result={date:state.today,text:state.thought};break;
  default:return reply({message:'This operation is not supported in the isolated demo.'},400);
 }
 write(state);return reply(result);
};
