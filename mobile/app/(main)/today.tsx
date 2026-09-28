import { useCallback,useEffect,useRef,useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator,Pressable,StyleSheet,Text,View } from 'react-native';
import { Button,Notice,Screen,styles } from '../../src/components/ui';
import { AccountMenu } from '../../src/components/AccountMenu';
import { BotanicalFlower } from '../../src/components/BotanicalFlower';
import { LoadState,useProductData } from '../../src/components/product';
import { findFlower } from '../../src/features/flowers';
import { sharedGrowth } from '../../src/features/growth';
import { completeMove,getGardenState,getMove,getTodayMove,getProgram,type Move } from '../../src/features/product';
import { sessionStorage } from '../../src/lib/storage';
import { useAuth } from '../../src/providers/AuthProvider';
import { theme } from '../../src/theme';

const goals=[
 {title:'Notice each other again',fallback:'Routine makes familiar effort easy to stop seeing. Naming one concrete thing trains your attention back toward what your partner is already bringing into the relationship.'},
 {title:'Change the default',fallback:'A routine only changes when something different happens inside it. This move creates a positive break from the automatic version of the day.'},
 {title:'Change the pattern in the moment',fallback:'Negative patterns are kept alive by repeated reactions. This move gives you one simple alternative to practise in the moment.'},
 {title:'Keep what works',fallback:'One good moment matters, but repetition is what makes it easier to happen again. This move helps turn something useful into a habit you can keep.'},
];

function LeafMark(){
 return <View style={s.leafMark} accessible={false}><View style={s.leafBlade}/><View style={s.leafStem}/></View>;
}

function WeekProgress({day}:{day:number}){
 const within=((Math.max(1,day)-1)%7)+1;
 return <View style={s.weekProgress} accessibilityLabel={`Day ${day}`}>
  {Array.from({length:7},(_,index)=><View key={index} style={[s.progressDot,index<within&&s.progressDotFilled,index===within-1&&s.progressDotCurrent]}/>)}
 </View>;
}

function PrimaryMoveButton({busy,onPress}:{busy:boolean;onPress:()=>void}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={onPress}
  style={({pressed})=>[s.primaryButton,pressed&&!busy&&s.primaryButtonPressed,busy&&s.buttonDisabled]}>
  {busy?<ActivityIndicator color={theme.colors.white}/>:<><Text style={s.primaryButtonText}>I did this</Text><Text style={s.primaryArrow}>→</Text></>}
 </Pressable>;
}

function SecondaryMoveButton({label,busy=false,onPress}:{label:string;busy?:boolean;onPress:()=>void}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={onPress}
  style={({pressed})=>[s.secondaryButton,pressed&&!busy&&s.secondaryButtonPressed,busy&&s.buttonDisabled]}>
  {busy?<ActivityIndicator color={theme.colors.sage}/>:<><Text style={s.secondaryButtonText}>{label}</Text><Text style={s.secondaryArrow}>→</Text></>}
 </Pressable>;
}

export default function Today(){
 const {session}=useAuth();
 const load=useCallback(async()=>{
  const program=await getProgram(session!.user.id);
  if(!program.routineActivated)return{program,garden:null,move:null as Move|null};
  const [gardenResult,moveResult]=await Promise.allSettled([getGardenState(),getTodayMove(session!.user.id)]);
  if(gardenResult.status==='rejected')throw gardenResult.reason;
  const garden=gardenResult.value;
  if(moveResult.status==='fulfilled')return{program,garden,move:moveResult.value};
  if(garden.bloom)return{program,garden,move:null as Move|null};
  throw moveResult.reason;
 },[session!.user.id]);
 const state=useProductData(load);
 const locked=useRef(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [joinIntro,setJoinIntro]=useState(false);
 const [whyOpen,setWhyOpen]=useState(false);

 useEffect(()=>{
  let active=true;
  const program=state.data?.program;
  if(!program||program.role!=='member_b'||program.joinedDay<=1)return;
  const key=`same-side.join-intro.${session!.user.id}.${program.relationshipId}`;
  void sessionStorage.getItem(key).then(value=>{if(active&&!value)setJoinIntro(true);});
  return()=>{active=false};
 },[state.data?.program,session]);

 useEffect(()=>{
  if(state.loading||state.data?.program?.routineActivated)return;
  const timer=setInterval(()=>{void state.refresh();},5000);
  return()=>clearInterval(timer);
 },[state.loading,state.data?.program?.routineActivated]);

 async function dismissJoinIntro(){
  const program=state.data?.program;
  if(!program)return;
  await sessionStorage.setItem(`same-side.join-intro.${session!.user.id}.${program.relationshipId}`,'1');
  setJoinIntro(false);
 }

 async function complete(){
  const current=state.data?.move;
  const snapshot=state.data;
  if(locked.current||!current||!snapshot)return;
  locked.current=true;
  setBusy(true);
  setError(null);
  state.mutate({...snapshot,move:{...current,status:'completed'}});
  try{
   await completeMove(current.id);
   void state.refresh();
  }catch(cause){
   state.mutate(snapshot);
   setError(cause instanceof Error?cause.message:'Please try again.');
  }finally{
   locked.current=false;
   setBusy(false);
  }
 }

 async function oneMore(){
  const current=state.data?.move;
  const snapshot=state.data;
  if(locked.current||!current||!snapshot||current.status!=='completed'||current.slot>=2)return;
  locked.current=true;
  setBusy(true);
  setError(null);
  try{
   const next=await getMove(current.slot+1);
   state.mutate({...snapshot,move:next});
   setWhyOpen(false);
   void state.refresh();
  }catch(cause){
   setError(cause instanceof Error?cause.message:'Please try again.');
  }finally{
   locked.current=false;
   setBusy(false);
  }
 }

 const move=state.data?.move;
 const program=state.data?.program;
 const afterRoutine=!!state.data?.garden?.programme_complete;
 const displayDay=Math.max(1,Math.min(28,move?.program_day??program?.day??1));
 const goal=move?Math.min(4,Math.max(1,Math.ceil(move.program_day/7))):Math.min(4,Math.max(1,Math.ceil(displayDay/7)));
 const why=move?.task_why?.trim()||goals[goal-1].fallback;
 const flower=findFlower(program?.selectedFlower??null);
 const growthState=state.data?.garden?sharedGrowth(state.data.garden.stage_key,displayDay):undefined;
 const primary=!move||move.slot===0;

 return <Screen compact>
  <View pointerEvents="none" style={s.paperWashTop}/>
  <View pointerEvents="none" style={s.paperWashBottom}/>

  <View style={s.topBar}>
   <Text style={s.todayTitle}>Today</Text>
   <AccountMenu/>
  </View>

  <LoadState {...state}/>

  {!state.loading&&!state.error&&program&&joinIntro&&<View style={s.editorialState}>
   <Text style={s.stateKicker}>YOU’RE JOINING WHAT’S ALREADY GROWING</Text>
   <Text style={s.stateTitle}>{program.day>28?'The Routine is already underway.':`You’re joining in Week ${program.week}.`}</Text>
   <Text style={s.stateBody}>{program.day>28?'There’s nothing to catch up on. Start with the Move in front of you and grow the same flower from here.':'There’s nothing to make up. Begin with the Move in front of you and grow from here together.'}</Text>
   {flower&&<View style={s.stateFlower}><BotanicalFlower flower={flower.id} state={growthState} size={190}/></View>}
   <Button label="Start from here" onPress={()=>{void dismissJoinIntro();}}/>
  </View>}

  {!state.loading&&!state.error&&program&&!program.routineActivated&&<View style={s.editorialState}>
   <Text style={s.stateKicker}>THE ROUTINE</Text>
   <Text style={s.stateTitle}>{program.memberCount<2?'Your Routine is ready':'Almost ready'}</Text>
   <Text style={s.stateBody}>{program.memberCount<2?'Your first day begins when your partner joins and completes their setup.':'Your partner has joined. Day 1 begins as soon as both personalization profiles are ready.'}</Text>
   {flower&&<View style={s.stateFlower}><BotanicalFlower flower={flower.id} size={180}/></View>}
   {program.role==='member_a'&&program.memberCount<2&&<Button label="Invite your partner" onPress={()=>router.push('/invite-partner')}/>}
  </View>}

  {!state.loading&&!state.error&&program&&program.routineActivated&&state.data?.garden?.bloom&&(!move||move.status==='completed')&&<View style={s.routineComplete}>
   <View style={s.completeBadge}><Text style={s.completeCheck}>✓</Text><Text style={s.completeBadgeText}>The Routine is complete</Text></View>
   {flower&&<View style={s.bloomArt}><BotanicalFlower flower={flower.id} state={growthState} size={286}/></View>}
   <Text style={s.routineCompleteTitle}>You grew this together.</Text>
   <Text style={s.routineCompleteBody}>Your shared flower reached full bloom. Missing days never counted against you.</Text>
   <Button label="Celebrate what you grew" onPress={()=>router.push('/routine-complete')}/>
   <Pressable accessibilityRole="button" onPress={()=>router.navigate('/garden')} style={s.quietAction}><Text style={s.quietActionText}>See your flower →</Text></Pressable>
  </View>}

  {!state.loading&&!state.error&&move&&program&&program.routineActivated&&!joinIntro&&!(state.data?.garden?.bloom&&move.status==='completed')&&<>
   {move.status!=='completed'?<>
    <View style={s.dayMeta}>
     <Text style={s.dayMetaText}>{afterRoutine?'KEEP WHAT HELPED':`WEEK ${goal} · DAY ${move.program_day}`}</Text>
     <WeekProgress day={move.program_day}/>
    </View>

    <View style={s.moveHero}>
     {flower&&<View pointerEvents="none" style={s.heroFlower}><BotanicalFlower flower={flower.id} state={growthState} size={232}/></View>}
     <View style={s.heroCopy}>
      {!primary&&<Text style={s.extraMove}>YOUR EXTRA MOVE</Text>}
      <Text style={s.moveTitle}>{move.task_title}</Text>
      <Text style={s.moveBody}>{move.task_body}</Text>
     </View>
    </View>

    <Pressable accessibilityRole="button" accessibilityState={{expanded:whyOpen}} onPress={()=>setWhyOpen(value=>!value)} style={[s.whySurface,whyOpen&&s.whySurfaceOpen]}>
     <View style={s.whyHeader}><View style={s.whyTitleRow}><LeafMark/><Text style={s.whyLabel}>Why this Move?</Text></View><Text style={s.whyChevron}>{whyOpen?'⌃':'⌄'}</Text></View>
     {whyOpen&&<Text style={s.whyBody}>{why}</Text>}
    </Pressable>

    <PrimaryMoveButton busy={busy} onPress={()=>{void complete();}}/>
    <View style={s.growingTogether}><LeafMark/><Text style={s.growingText}>Growing together · Day {move.program_day}</Text></View>
   </>:<View style={s.completedState}>
    <View style={s.completedHero}>
     {flower&&<View pointerEvents="none" style={s.completedFlower}><BotanicalFlower flower={flower.id} state={growthState} size={274}/></View>}
     <View style={s.completeBadge}><Text style={s.completeCheck}>✓</Text><Text style={s.completeBadgeText}>Completed</Text></View>
     <Text style={s.completedTitle}>{move.task_title}</Text>
     <Text style={s.completedMessage}>You made space for connection today.</Text>
    </View>

    {move.slot<2?<SecondaryMoveButton label="Show me another Move" busy={busy} onPress={()=>{void oneMore();}}/>:<View style={s.enoughState}><Text style={s.enoughTitle}>That’s plenty for today.</Text><Text style={s.enoughBody}>Come back tomorrow for your next Move.</Text></View>}
    <Pressable accessibilityRole="button" onPress={()=>router.navigate('/garden')} style={s.flowerAction}><LeafMark/><Text style={s.flowerActionText}>See your flower</Text><Text style={s.flowerActionArrow}>→</Text></Pressable>
    <View style={s.growingTogether}><LeafMark/><Text style={s.growingText}>Growing together · Day {move.program_day}</Text></View>
   </View>}

   {error&&<View style={s.errorWrap}><Notice>{error}</Notice><Button label="Try again" secondary disabled={busy} onPress={()=>{setError(null);void state.refresh();}}/></View>}
  </>}
 </Screen>;
}

const s=StyleSheet.create({
 paperWashTop:{position:'absolute',width:300,height:300,borderRadius:150,backgroundColor:theme.colors.rose,opacity:.13,top:120,right:-185},
 paperWashBottom:{position:'absolute',width:330,height:190,borderRadius:170,backgroundColor:theme.colors.sand,opacity:.28,bottom:-60,left:-175},
 topBar:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:2,marginBottom:24},
 todayTitle:{fontFamily:theme.fonts.heading,fontSize:27,lineHeight:34,color:theme.colors.ink,letterSpacing:-.55},
 dayMeta:{gap:12,marginTop:4,marginBottom:22},
 dayMetaText:{fontSize:11,lineHeight:15,letterSpacing:1.65,fontWeight:'700',color:theme.colors.muted,textTransform:'uppercase'},
 weekProgress:{flexDirection:'row',alignItems:'center',gap:7},
 progressDot:{width:8,height:8,borderRadius:4,backgroundColor:theme.colors.line},
 progressDotFilled:{backgroundColor:theme.colors.sageMid},
 progressDotCurrent:{width:24,backgroundColor:theme.colors.sage},
 moveHero:{position:'relative',minHeight:344,marginHorizontal:-2,overflow:'hidden'},
 heroCopy:{position:'relative',zIndex:2,paddingTop:18},
 heroFlower:{position:'absolute',zIndex:1,right:-76,top:-6,opacity:.78},
 extraMove:{fontSize:10,lineHeight:14,letterSpacing:1.5,fontWeight:'800',color:theme.colors.sageMid,marginBottom:9},
 moveTitle:{fontFamily:theme.fonts.heading,fontSize:45,lineHeight:49,color:theme.colors.black,letterSpacing:-1.35,maxWidth:292,marginBottom:22},
 moveBody:{fontSize:16.5,lineHeight:25,color:theme.colors.black,maxWidth:314,letterSpacing:-.08},
 whySurface:{borderRadius:24,borderWidth:1,borderColor:'rgba(210,197,181,0.66)',backgroundColor:'rgba(255,252,247,0.82)',paddingHorizontal:18,paddingVertical:17,marginTop:2,marginBottom:18,...theme.shadow.card},
 whySurfaceOpen:{paddingBottom:20},
 whyHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
 whyTitleRow:{flexDirection:'row',alignItems:'center',gap:11},
 whyLabel:{fontSize:15.5,lineHeight:21,fontWeight:'600',color:theme.colors.black},
 whyChevron:{fontSize:20,lineHeight:22,color:theme.colors.inkSoft},
 whyBody:{fontSize:14.5,lineHeight:22.5,color:theme.colors.inkSoft,marginTop:15,paddingRight:6},
 leafMark:{width:22,height:22,position:'relative'},
 leafBlade:{position:'absolute',width:14,height:9,borderTopLeftRadius:12,borderBottomRightRadius:12,backgroundColor:theme.colors.sageLight,transform:[{rotate:'-30deg'}],top:3,left:4,borderWidth:1,borderColor:theme.colors.sageMid},
 leafStem:{position:'absolute',width:1.3,height:13,backgroundColor:theme.colors.sageMid,transform:[{rotate:'35deg'}],left:10,top:8,borderRadius:2},
 primaryButton:{minHeight:61,borderRadius:999,backgroundColor:theme.colors.sage,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:15,paddingHorizontal:24,...theme.shadow.floating},
 primaryButtonPressed:{transform:[{scale:.987}],opacity:.95},
 primaryButtonText:{fontSize:16.5,lineHeight:22,fontWeight:'600',color:theme.colors.white,letterSpacing:.05},
 primaryArrow:{fontSize:21,lineHeight:22,color:theme.colors.white,fontWeight:'400'},
 buttonDisabled:{opacity:.55},
 growingTogether:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},
 growingText:{fontSize:12.5,lineHeight:18,color:theme.colors.sageMid},
 completedState:{paddingTop:4},
 completedHero:{position:'relative',minHeight:430,overflow:'hidden',paddingTop:18},
 completedFlower:{position:'absolute',right:-62,top:-36,opacity:.95},
 completeBadge:{flexDirection:'row',alignItems:'center',gap:9,zIndex:2,alignSelf:'flex-start'},
 completeCheck:{width:28,height:28,borderRadius:14,backgroundColor:theme.colors.sageLight,color:theme.colors.sage,textAlign:'center',textAlignVertical:'center',fontSize:16,lineHeight:28,fontWeight:'800',overflow:'hidden'},
 completeBadgeText:{fontSize:13.5,lineHeight:19,color:theme.colors.sage,fontWeight:'600'},
 completedTitle:{fontFamily:theme.fonts.heading,fontSize:43,lineHeight:47,color:theme.colors.mutedSoft,letterSpacing:-1.25,maxWidth:280,marginTop:104,zIndex:2},
 completedMessage:{fontSize:16,lineHeight:24,color:theme.colors.muted,maxWidth:260,marginTop:18,zIndex:2},
 secondaryButton:{minHeight:58,borderRadius:999,borderWidth:1,borderColor:'rgba(228,218,204,0.86)',backgroundColor:'rgba(255,252,247,0.82)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:14,paddingHorizontal:22,...theme.shadow.card},
 secondaryButtonPressed:{transform:[{scale:.988}],backgroundColor:theme.colors.card},
 secondaryButtonText:{fontSize:15.5,lineHeight:21,fontWeight:'600',color:theme.colors.black},
 secondaryArrow:{fontSize:20,lineHeight:21,color:theme.colors.inkSoft},
 flowerAction:{minHeight:54,marginTop:10,borderRadius:999,backgroundColor:'rgba(255,252,247,0.54)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,paddingHorizontal:20},
 flowerActionText:{fontSize:14,lineHeight:20,color:theme.colors.inkSoft,fontWeight:'500'},
 flowerActionArrow:{fontSize:17,color:theme.colors.inkSoft,marginLeft:3},
 enoughState:{paddingVertical:17,paddingHorizontal:4,alignItems:'center',gap:4},
 enoughTitle:{fontFamily:theme.fonts.heading,fontSize:21,lineHeight:27,color:theme.colors.ink},
 enoughBody:{fontSize:13.5,lineHeight:20,color:theme.colors.muted},
 errorWrap:{gap:10,marginTop:10},
 editorialState:{paddingTop:34,paddingBottom:22,gap:16},
 stateKicker:{fontSize:10.5,lineHeight:15,letterSpacing:1.6,fontWeight:'800',color:theme.colors.sageMid},
 stateTitle:{fontFamily:theme.fonts.heading,fontSize:39,lineHeight:44,color:theme.colors.ink,letterSpacing:-1.05,maxWidth:330},
 stateBody:{fontSize:16,lineHeight:24.5,color:theme.colors.muted,maxWidth:330},
 stateFlower:{height:188,overflow:'hidden',alignItems:'center',justifyContent:'center'},
 routineComplete:{paddingTop:18,paddingBottom:18,gap:17},
 bloomArt:{height:250,alignItems:'center',justifyContent:'center',overflow:'hidden',marginTop:-14,marginBottom:-18},
 routineCompleteTitle:{fontFamily:theme.fonts.heading,fontSize:42,lineHeight:47,color:theme.colors.ink,letterSpacing:-1.2},
 routineCompleteBody:{fontSize:16,lineHeight:24.5,color:theme.colors.muted,maxWidth:330,marginBottom:4},
 quietAction:{minHeight:44,alignSelf:'center',justifyContent:'center',paddingHorizontal:12},
 quietActionText:{fontSize:13.5,lineHeight:19,fontWeight:'600',color:theme.colors.sage},
});
