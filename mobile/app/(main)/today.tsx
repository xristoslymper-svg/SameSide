import { useCallback,useEffect,useRef,useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator,Image,Pressable,StyleSheet,Text,View } from 'react-native';
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
 {title:'Notice each other again',body:'Notice the effort and attention that can disappear into routine.',fallback:'Routine makes familiar effort easy to stop seeing. Naming one concrete thing trains your attention back toward what your partner is already bringing into the relationship.'},
 {title:'Change the default',body:'Put small moments of warmth, play and choice back into ordinary days.',fallback:'A routine only changes when something different happens inside it. This move creates a positive break from the automatic version of the day.'},
 {title:'Change the pattern in the moment',body:'Catch an old reaction and practise one different response when it matters.',fallback:'Negative patterns are kept alive by repeated reactions. This move gives you one simple alternative to practise in the moment.'},
 {title:'Keep what works',body:'Repeat the moments that helped so they become easier to return to.',fallback:'One good moment matters, but repetition is what makes it easier to happen again. This move helps turn something useful into a habit you can keep.'},
];

function LeafMark(){
 return <View style={s.leafMark} accessible={false}><View style={s.leafBlade}/><View style={s.leafStem}/></View>;
}

function SproutMark(){
 return <View style={s.sprout} accessible={false}><View style={s.sproutStem}/><View style={[s.sproutLeaf,{left:0,borderTopLeftRadius:8,borderBottomRightRadius:8}]}/><View style={[s.sproutLeaf,{right:0,top:3,borderTopRightRadius:8,borderBottomLeftRadius:8}]}/></View>;
}

function WeekProgress({day}:{day:number}){
 const within=((Math.max(1,day)-1)%7)+1;
 return <View style={s.weekProgress} accessibilityLabel={`Day ${day}`}>
  {Array.from({length:7},(_,index)=><View key={index} style={[s.progressDot,index<within&&s.progressDotFilled,index===within-1&&s.progressDotCurrent,index>within-1&&{opacity:Math.max(.3,1-(index-within+1)*.17)}]}/>)}
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
 const moveTitleLength=move?.task_title?.length??0;
 const compactTitle=moveTitleLength>18;
 const longTitle=moveTitleLength>28;

 return <Screen compact>
  <View pointerEvents="none" style={s.paperWashTop}/>
  <View pointerEvents="none" style={s.paperWashBottom}/>

  <View style={s.topBar}>
   <Text style={s.todayTitle}>Today</Text>
   <View style={s.accountButton}><AccountMenu/></View>
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
   <View style={s.heroStage}>
    <View pointerEvents="none" style={s.heroArtWrap} accessible={false}>
     <Image source={require('../../assets/today-botanical-bespoke.png')} style={s.heroArt} resizeMode="cover"/>
    </View>

    <View style={s.dayMeta}>
    <Text style={s.dayMetaText}>{afterRoutine?'KEEP WHAT HELPED':`WEEK ${goal} · DAY ${move.program_day}`}</Text>
    <WeekProgress day={move.program_day}/>
   </View>

   <View style={s.moveHero}>
    <View style={s.heroCopy}>
     {!primary&&<Text style={s.extraMove}>YOUR EXTRA MOVE</Text>}
     <Text style={[s.moveTitle,compactTitle&&s.moveTitleCompact,longTitle&&s.moveTitleLong]}>{move.task_title}</Text>
     <Text style={s.moveBody}>{move.task_body}</Text>
    </View>
   </View>

   <Pressable accessibilityRole="button" accessibilityState={{expanded:whyOpen}} onPress={()=>setWhyOpen(value=>!value)} style={[s.whySurface,whyOpen&&s.whySurfaceOpen]}>
    <View style={s.whyHeader}><View style={s.whyTitleRow}><View style={s.whyIcon}><LeafMark/></View><Text style={s.whyLabel}>Why this Move?</Text></View><Text style={s.whyChevron}>{whyOpen?'⌃':'⌄'}</Text></View>
    {whyOpen&&<Text style={s.whyBody}>{why}</Text>}
   </Pressable>

   {move.status!=='completed'?<PrimaryMoveButton busy={busy} onPress={()=>{void complete();}}/>:<>
    <View style={[s.primaryButton,s.completedPrimary]}><Text style={s.primaryButtonText}>Completed</Text><Text style={s.primaryArrow}>✓</Text></View>
    {move.slot<2&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>{void oneMore();}} style={({pressed})=>[s.extraAction,pressed&&!busy&&s.extraActionPressed,busy&&s.buttonDisabled]}><Text style={s.extraActionText}>Show me another Move</Text><Text style={s.extraActionArrow}>→</Text></Pressable>}
   </>}
    <View style={s.growingTogether}><SproutMark/><Text style={s.growingText}>{move.program_day===1?'1 day together':`${move.program_day} days together`}</Text></View>
   </View>

   {!afterRoutine&&<View style={s.pathCard}>
    <Text style={s.pathKicker}>THE FOUR WEEKS</Text>
    <View style={s.goalList}>
     {goals.map((item,index)=>{
      const n=index+1;
      const current=n===goal;
      const past=n<goal;
      const next=n===goal+1;
      return <View key={item.title} style={[s.goalRow,current&&s.goalCurrent]}>
       <View style={[s.goalNumber,current&&s.goalNumberCurrent,past&&s.goalNumberPast]}>
        <Text style={[s.goalNumberText,(current||past)&&s.goalNumberTextActive]}>{past?'✓':n}</Text>
       </View>
       <View style={s.goalCopy}>
        <Text style={[s.goalLabel,current&&s.goalLabelCurrent]}>{current?'CURRENT WEEK':past?'COMPLETED':next?'NEXT WEEK':'LATER'}</Text>
        <Text style={[s.goalTitle,current&&s.goalTitleCurrent]}>{item.title}</Text>
        {next&&<Text style={s.goalBody}>{item.body}</Text>}
       </View>
      </View>;
     })}
    </View>
   </View>}

   {error&&<View style={s.errorWrap}><Notice>{error}</Notice><Button label="Try again" secondary disabled={busy} onPress={()=>{setError(null);void state.refresh();}}/></View>}
  </>}
 </Screen>;
}

const s=StyleSheet.create({
 paperWashTop:{position:'absolute',width:420,height:420,borderRadius:210,backgroundColor:'#F0D9D0',opacity:.32,top:-40,right:-250},
 paperWashBottom:{position:'absolute',width:460,height:300,borderRadius:230,backgroundColor:'#C9CDB8',opacity:.38,bottom:-120,right:-190},

 topBar:{position:'relative',zIndex:3,minHeight:40,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:0,marginBottom:18,paddingHorizontal:2},
 todayTitle:{fontSize:24,lineHeight:30,color:'#1E2F26',letterSpacing:-.3,fontWeight:'400'},
 accountButton:{transform:[{scale:.84}],marginRight:-4},

 heroStage:{position:'relative',zIndex:1,overflow:'visible',paddingBottom:4},
 heroArtWrap:{position:'absolute',zIndex:0,right:-70,top:-6,width:440,height:660,overflow:'hidden'},
 heroArt:{width:'100%',height:'100%',opacity:.92},

 dayMeta:{position:'relative',zIndex:2,gap:12,marginTop:0,marginBottom:30},
 dayMetaText:{fontSize:11,lineHeight:15,letterSpacing:1.8,fontWeight:'500',color:'#8A8A7E',textTransform:'uppercase'},
 weekProgress:{flexDirection:'row',alignItems:'center',gap:6},
 progressDot:{width:6,height:6,borderRadius:3,backgroundColor:'#E2D8C6'},
 progressDotFilled:{backgroundColor:'#2F5F49'},
 progressDotCurrent:{width:46,backgroundColor:'#D8BE96'},

 moveHero:{position:'relative',zIndex:2,overflow:'visible'},
 heroCopy:{position:'relative',zIndex:2,maxWidth:300,paddingRight:4},
 heroFlower:{position:'absolute',zIndex:1,right:-56,top:-78,width:238,height:369,opacity:.94},
 heroFlowerImage:{width:'100%',height:'100%'},
 extraMove:{fontSize:9,lineHeight:13,letterSpacing:1.5,fontWeight:'800',color:'#718773',marginBottom:8,textTransform:'uppercase'},
 moveTitle:{fontFamily:theme.fonts.heading,fontSize:47,lineHeight:51,color:'#1B2A22',letterSpacing:-1.5,maxWidth:262,marginBottom:22,fontWeight:'400'},
 moveTitleCompact:{fontSize:42,lineHeight:46,maxWidth:262,letterSpacing:-1.2},
 moveTitleLong:{fontSize:36,lineHeight:40,maxWidth:270,letterSpacing:-.9},
 moveBody:{fontSize:16.5,lineHeight:25.5,color:'#2B3A32',maxWidth:296,letterSpacing:-.1,fontWeight:'400'},

 whySurface:{position:'relative',zIndex:2,width:'100%',maxWidth:350,alignSelf:'center',minHeight:68,borderRadius:34,borderWidth:1,borderColor:'rgba(255,255,255,0.75)',backgroundColor:'rgba(255,253,249,0.66)',paddingHorizontal:20,paddingVertical:16,marginTop:44,marginBottom:64,shadowColor:'#3B4A3A',shadowOpacity:.10,shadowRadius:26,shadowOffset:{width:0,height:12},elevation:3},
 whySurfaceOpen:{borderRadius:30,paddingBottom:20,marginBottom:52},
 whyHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:28},
 whyIcon:{width:30,height:30,borderRadius:15,backgroundColor:'#E3EAD9',alignItems:'center',justifyContent:'center'},
 whyTitleRow:{flexDirection:'row',alignItems:'center',gap:14},
 whyLabel:{fontSize:16,lineHeight:22,fontWeight:'600',color:'#1E2F26'},
 whyChevron:{fontSize:18,lineHeight:22,color:'#3F5147'},
 whyBody:{fontSize:14.5,lineHeight:22,color:'#4E5C53',marginTop:14,paddingRight:6},

 leafMark:{width:20,height:20,position:'relative'},
 leafBlade:{position:'absolute',width:13,height:8,borderTopLeftRadius:12,borderBottomRightRadius:12,backgroundColor:'#CBD8C2',transform:[{rotate:'-30deg'}],top:3,left:4,borderWidth:1,borderColor:'#5F7F66'},
 leafStem:{position:'absolute',width:1.2,height:12,backgroundColor:'#5F7F66',transform:[{rotate:'35deg'}],left:9,top:8,borderRadius:2},

 sprout:{width:16,height:16},
 sproutStem:{position:'absolute',left:7.4,bottom:1,width:1.3,height:11,borderRadius:1,backgroundColor:'#7C8F80'},
 sproutLeaf:{position:'absolute',top:1,width:8,height:6,backgroundColor:'#A9BBA4'},
 primaryButton:{position:'relative',zIndex:2,width:'92%',maxWidth:332,alignSelf:'center',minHeight:58,borderRadius:999,backgroundColor:'#2A5A44',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,paddingHorizontal:26,shadowColor:'#1F3D2E',shadowOpacity:.22,shadowRadius:22,shadowOffset:{width:0,height:12},elevation:6},
 primaryButtonPressed:{transform:[{scale:.987}],opacity:.95},
 completedPrimary:{opacity:.93,shadowOpacity:.055,elevation:2},
 primaryButtonText:{fontSize:17,lineHeight:22,fontWeight:'500',color:theme.colors.white,letterSpacing:.1},
 primaryArrow:{fontSize:19,lineHeight:22,color:theme.colors.white,fontWeight:'300'},
 buttonDisabled:{opacity:.55},

 extraAction:{position:'relative',zIndex:2,alignSelf:'center',minHeight:34,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingHorizontal:14,marginTop:10},
 extraActionPressed:{opacity:.65},
 extraActionText:{fontSize:13,lineHeight:19,color:'#567460',fontWeight:'600'},
 extraActionArrow:{fontSize:15,lineHeight:19,color:'#567460'},

 growingTogether:{position:'relative',zIndex:2,minHeight:36,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:26,marginBottom:0},
 growingText:{fontSize:12.5,lineHeight:18,color:'#7C8F80'},

 completedState:{paddingTop:2},
 completedHero:{position:'relative',minHeight:350,overflow:'hidden',paddingTop:12},
 completedFlower:{position:'absolute',right:-54,top:-52,width:224,height:347,opacity:.97},
 completedFlowerImage:{width:'100%',height:'100%'},
 completeBadge:{flexDirection:'row',alignItems:'center',gap:8,zIndex:2,alignSelf:'flex-start'},
 completeCheck:{width:26,height:26,borderRadius:13,backgroundColor:theme.colors.sageLight,color:theme.colors.sage,textAlign:'center',textAlignVertical:'center',fontSize:15,lineHeight:26,fontWeight:'800',overflow:'hidden'},
 completeBadgeText:{fontSize:13,lineHeight:18,color:theme.colors.sage,fontWeight:'600'},
 completedTitle:{fontFamily:theme.fonts.heading,fontSize:38,lineHeight:42,color:theme.colors.mutedSoft,letterSpacing:-1.05,maxWidth:238,marginTop:86,zIndex:2},
 completedMessage:{fontSize:14.5,lineHeight:22,color:theme.colors.muted,maxWidth:238,marginTop:14,zIndex:2},

 secondaryButton:{minHeight:54,borderRadius:999,borderWidth:1,borderColor:'rgba(228,218,204,0.82)',backgroundColor:'rgba(255,252,247,0.78)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,paddingHorizontal:20,...theme.shadow.card},
 secondaryButtonPressed:{transform:[{scale:.988}],backgroundColor:theme.colors.card},
 secondaryButtonText:{fontSize:14.5,lineHeight:20,fontWeight:'600',color:theme.colors.black},
 secondaryArrow:{fontSize:18,lineHeight:20,color:theme.colors.inkSoft},
 flowerAction:{minHeight:48,marginTop:8,borderRadius:999,backgroundColor:'rgba(255,252,247,0.5)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingHorizontal:18},
 flowerActionText:{fontSize:13.5,lineHeight:19,color:theme.colors.inkSoft,fontWeight:'500'},
 flowerActionArrow:{fontSize:16,color:theme.colors.inkSoft,marginLeft:2},

 pathCard:{position:'relative',zIndex:2,marginTop:24,marginBottom:112,paddingTop:16,paddingHorizontal:4,paddingBottom:8,borderTopWidth:1,borderTopColor:'rgba(210,197,181,0.22)'},
 pathKicker:{fontSize:10,lineHeight:14,letterSpacing:1.65,fontWeight:'800',color:theme.colors.sageMid,marginBottom:12,paddingHorizontal:8},
 goalList:{gap:2},
 goalRow:{flexDirection:'row',gap:12,paddingVertical:11,paddingHorizontal:8,borderRadius:18,opacity:.52},
 goalCurrent:{backgroundColor:'rgba(237,242,236,0.58)',opacity:1},
 goalNumber:{width:32,height:32,borderRadius:16,borderWidth:1,borderColor:theme.colors.lineStrong,alignItems:'center',justifyContent:'center',marginTop:1},
 goalNumberCurrent:{backgroundColor:theme.colors.sageMid,borderColor:theme.colors.sageMid},
 goalNumberPast:{backgroundColor:'#DDE9DA',borderColor:'#DDE9DA'},
 goalNumberText:{fontSize:12,fontWeight:'800',color:theme.colors.muted},
 goalNumberTextActive:{color:theme.colors.white},
 goalCopy:{flex:1,minWidth:0},
 goalLabel:{fontSize:9,lineHeight:12,letterSpacing:1.15,fontWeight:'800',color:theme.colors.mutedSoft},
 goalLabelCurrent:{color:theme.colors.sage},
 goalTitle:{fontFamily:theme.fonts.heading,fontSize:17,lineHeight:22,color:theme.colors.inkSoft,marginTop:2},
 goalTitleCurrent:{color:theme.colors.ink},
 goalBody:{fontSize:12.5,lineHeight:18.5,color:theme.colors.muted,marginTop:4},
 enoughState:{paddingVertical:15,paddingHorizontal:4,alignItems:'center',gap:4},
 enoughTitle:{fontFamily:theme.fonts.heading,fontSize:20,lineHeight:25,color:theme.colors.ink},
 enoughBody:{fontSize:13,lineHeight:19,color:theme.colors.muted},
 errorWrap:{position:'relative',zIndex:3,gap:10,marginTop:8},

 editorialState:{paddingTop:28,paddingBottom:20,gap:15},
 stateKicker:{fontSize:10,lineHeight:14,letterSpacing:1.5,fontWeight:'800',color:theme.colors.sageMid},
 stateTitle:{fontFamily:theme.fonts.heading,fontSize:37,lineHeight:42,color:theme.colors.ink,letterSpacing:-1,maxWidth:320},
 stateBody:{fontSize:15,lineHeight:23,color:theme.colors.muted,maxWidth:320},
 stateFlower:{height:180,overflow:'hidden',alignItems:'center',justifyContent:'center'},

 routineComplete:{paddingTop:14,paddingBottom:16,gap:16},
 bloomArt:{height:235,alignItems:'center',justifyContent:'center',overflow:'hidden',marginTop:-12,marginBottom:-16},
 routineCompleteTitle:{fontFamily:theme.fonts.heading,fontSize:39,lineHeight:44,color:theme.colors.ink,letterSpacing:-1.1},
 routineCompleteBody:{fontSize:15,lineHeight:23,color:theme.colors.muted,maxWidth:320,marginBottom:3},
 quietAction:{minHeight:42,alignSelf:'center',justifyContent:'center',paddingHorizontal:12},
 quietActionText:{fontSize:13,lineHeight:18,fontWeight:'600',color:theme.colors.sage},
});