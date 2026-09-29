import { router } from 'expo-router';
import { useEffect,useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button, Notice, styles } from './ui';
import { getRelationshipOverview,leaveRelationship,type RelationshipOverview } from '../features/relationships';
import { useAuth } from '../providers/AuthProvider';
import { useOnboarding } from '../providers/OnboardingProvider';
import { theme } from '../theme';

function AccountGlyph(){return <View accessible={false} style={{width:26,height:26,alignItems:'center',justifyContent:'center'}}><View style={{position:'absolute',top:4,width:8,height:8,borderRadius:4,borderWidth:1.3,borderColor:theme.colors.ink}}/><View style={{position:'absolute',bottom:4,width:17,height:8,borderTopLeftRadius:9,borderTopRightRadius:9,borderWidth:1.3,borderBottomWidth:0,borderColor:theme.colors.ink}}/></View>}

export function AccountMenu() {
  const { session, signOut } = useAuth();
  const { save } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [relationship,setRelationship]=useState<RelationshipOverview|null>(null);
  const [confirmLeave,setConfirmLeave]=useState(false);
  useEffect(()=>{if(!open||!session)return;let active=true;void getRelationshipOverview(session.user.id).then(value=>{if(active)setRelationship(value);}).catch(()=>{});return()=>{active=false};},[open,session]);
  async function signOutAccount() {
    if (busy) return;
    setBusy(true); setError(null);
    try { await signOut(); setOpen(false); router.replace('/'); }
    catch { setError('We couldn’t sign you out. Please try again.'); }
    finally { setBusy(false); }
  }
  async function disconnect(){if(busy)return;setBusy(true);setError(null);try{await leaveRelationship();setConfirmLeave(false);setOpen(false);await save({path:null,focus:[],step:'path'});}catch{setError('We couldn’t disconnect this relationship. Please try again.');}finally{setBusy(false);}}
  const relationshipTitle=relationship?.partnerName?`You & ${relationship.partnerName}`:relationship?.hasDeparture?'This shared space is no longer connected':'Waiting for your partner';
  return <><Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={() => setOpen(true)} style={({pressed})=>({ width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:theme.colors.line,backgroundColor:pressed?theme.colors.cardWarm:theme.colors.card })}><AccountGlyph/></Pressable>
    {open && <Modal visible transparent animationType="fade" onRequestClose={() => { setOpen(false); setConfirmLeave(false); }}>
      <View style={{ flex: 1, backgroundColor: '#17231D66', justifyContent: 'center', padding: 24 }}><View accessibilityViewIsModal style={[styles.card, { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: theme.radius.large, padding: 22, ...theme.shadow.floating }]}>
        <Text style={[styles.cardTitle,{fontSize:27}]}>Your account</Text><Text style={styles.small}>{session?.user.email}</Text>
        {relationship&&<View style={{marginTop:16,paddingTop:18,borderTopWidth:1,borderTopColor:theme.colors.line,gap:8}}><Text style={styles.eyebrow}>Your relationship</Text><Text style={[styles.cardTitle,{fontSize:20}]}>{relationshipTitle}</Text><Text style={styles.small}>{relationship.partnerActive?'Connected in one shared Routine.':relationship.hasDeparture?'This garden is still here for you. It can’t be connected to a different partner; start fresh when you’re ready.':'The Routine begins once your partner joins and finishes setup.'}</Text>{relationship.role==='member_a'&&relationship.memberCount<2&&!relationship.hasDeparture&&<Button label="Invite your partner" disabled={busy} onPress={()=>{setOpen(false);router.push({pathname:'/invite-partner',params:{returnTo:'today'}});}}/>}{(relationship.partnerName||relationship.hasDeparture)&&!confirmLeave&&<Button label={relationship.hasDeparture?'Start a new relationship':'Leave this relationship'} secondary disabled={busy} onPress={()=>setConfirmLeave(true)}/>} {confirmLeave&&<View style={{gap:10,marginTop:4}}><Notice>{relationship.partnerActive?'This disconnects your accounts. Your partner keeps access to the shared garden, and you can begin a new relationship.':'Starting fresh disconnects you from this old shared space. The existing data is not deleted.'}</Notice><Button label="Confirm and disconnect" busy={busy} onPress={()=>{void disconnect();}}/><Button label="Keep this relationship" secondary disabled={busy} onPress={()=>setConfirmLeave(false)}/></View>}</View>}
        {error && <Notice>{error}</Notice>}<Button label="Sign out" secondary busy={busy} onPress={() => { void signOutAccount(); }}/>
        <Button label="Close" secondary onPress={() => { setOpen(false); setError(null); setConfirmLeave(false); }}/>
      </View></View>
    </Modal>}</>;
}
