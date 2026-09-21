import { DemoEntry } from './DemoControls';
import { isDemo } from '../lib/demo';
import { router } from 'expo-router';
import { useEffect,useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Button, Notice, styles } from './ui';
import { getRelationshipOverview,leaveRelationship,type RelationshipOverview } from '../features/relationships';
import { isDevelopmentPasswordSignInEnabled, useAuth } from '../providers/AuthProvider';
import { useOnboarding } from '../providers/OnboardingProvider';
import { theme } from '../theme';

function AccountGlyph(){return <View accessible={false} style={{width:26,height:26,alignItems:'center',justifyContent:'center'}}><View style={{position:'absolute',top:4,width:8,height:8,borderRadius:4,borderWidth:1.3,borderColor:theme.colors.ink}}/><View style={{position:'absolute',bottom:4,width:17,height:8,borderTopLeftRadius:9,borderTopRightRadius:9,borderWidth:1.3,borderBottomWidth:0,borderColor:theme.colors.ink}}/></View>}

export function AccountMenu() {
  const { session, signOut, setTestPassword } = useAuth();
  const { save } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [relationship,setRelationship]=useState<RelationshipOverview|null>(null);
  const [confirmLeave,setConfirmLeave]=useState(false);
  useEffect(()=>{if(!open||!session)return;let active=true;void getRelationshipOverview(session.user.id).then(value=>{if(active)setRelationship(value);}).catch(()=>{});return()=>{active=false};},[open,session]);
  async function act(kind: 'password' | 'signout') {
    if (busy) return;
    if (kind === 'password' && password.length < 12) { setError('Use at least 12 characters.'); return; }
    setBusy(true); setError(null);
    try {
      if (kind === 'signout') { await signOut(); setOpen(false); router.replace('/'); }
      else { await setTestPassword(password); setPassword(''); setError('Test password saved.'); }
    } catch { setError('We couldn’t make that change. Please try again.'); }
    finally { setBusy(false); }
  }
  async function disconnect(){if(busy)return;setBusy(true);setError(null);try{await leaveRelationship();setConfirmLeave(false);setOpen(false);await save({intent:'solo',path:null,focus:[],step:'path'});}catch{setError('We couldn’t disconnect this relationship. Please try again.');}finally{setBusy(false);}}
  const relationshipTitle=relationship?.partnerName?`You & ${relationship.partnerName}`:relationship?.hasDeparture?'This shared space is no longer connected':'Just you for now';
  return <><Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={() => setOpen(true)} style={({pressed})=>({ width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:pressed?theme.colors.cardWarm:'transparent' })}><AccountGlyph/></Pressable>
    {open && <Modal visible transparent animationType="fade" onRequestClose={() => { setOpen(false); setPassword(''); setConfirmLeave(false); }}>
      <View style={{ flex: 1, backgroundColor: '#1F292355', justifyContent: 'center', padding: 24 }}><View accessibilityViewIsModal style={[styles.card, { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 28, padding: 22, ...theme.shadow.floating }]}>
        <DemoEntry/><Text style={[styles.cardTitle,{fontSize:27}]}>Your account</Text><Text style={styles.small}>{session?.user.email}</Text>
        {relationship&&<View style={{marginTop:16,paddingTop:18,borderTopWidth:1,borderTopColor:theme.colors.line,gap:8}}><Text style={styles.eyebrow}>Your relationship</Text><Text style={[styles.cardTitle,{fontSize:20}]}>{relationshipTitle}</Text><Text style={styles.small}>{relationship.partnerActive?'Connected in one shared garden. Your private moves and reflections remain separate.':relationship.hasDeparture?'This garden is still here for you. It can’t be connected to a different partner; start fresh when you’re ready.':'Invite your partner whenever it feels right.'}</Text>{(relationship.partnerName||relationship.hasDeparture)&&!confirmLeave&&<Button label={relationship.hasDeparture?'Start a new relationship':'Leave this relationship'} secondary disabled={busy} onPress={()=>setConfirmLeave(true)}/>} {confirmLeave&&<View style={{gap:10,marginTop:4}}><Notice>{relationship.partnerActive?'This disconnects your accounts. Your partner keeps access to the shared garden, and you can begin a new relationship.':'Starting fresh disconnects you from this old shared space. The existing data is not deleted.'}</Notice><Button label="Confirm and disconnect" busy={busy} onPress={()=>{void disconnect();}}/><Button label="Keep this relationship" secondary disabled={busy} onPress={()=>setConfirmLeave(false)}/></View>}</View>}
        {isDevelopmentPasswordSignInEnabled && !isDemo && <><Text style={styles.eyebrow}>Local testing only</Text><Text style={styles.body}>Set a test password</Text><TextInput accessibilityLabel="New test password" style={styles.input} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="At least 12 characters" placeholderTextColor={theme.colors.muted} value={password} onChangeText={setPassword}/><Button label="Save test password" secondary busy={busy} onPress={() => { void act('password'); }}/></>}
        {error && <Notice>{error}</Notice>}<Button label="Sign out" secondary busy={busy} onPress={() => { void act('signout'); }}/>
        <Button label="Close" secondary onPress={() => { setOpen(false); setPassword(''); setError(null); setConfirmLeave(false); }}/>
      </View></View>
    </Modal>}</>;
}
