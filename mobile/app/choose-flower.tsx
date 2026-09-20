import { useCallback, useState } from 'react';
import { useInvitation } from '../src/providers/InvitationProvider';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { Brand, Button, Notice, Screen, styles } from '../src/components/ui';
import { BotanicalFlower } from '../src/components/BotanicalFlower';
import { CommunityGarden } from '../src/components/CommunityGarden';
import { LoadState, useProductData } from '../src/components/product';
import { chooseFlower, findFlower, flowers, type FlowerId } from '../src/features/flowers';
import { ensureRelationship } from '../src/features/relationships';
import { getProgram } from '../src/features/product';
import { useAuth } from '../src/providers/AuthProvider';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import { SetupExit } from '../src/components/SetupExit';
import { theme } from '../src/theme';

export default function ChooseFlower() {
 const { token } = useInvitation();
 if (token) return <Redirect href="/invite/resume"/>;
 return <FlowerSelection/>;
}
function FlowerSelection() {
 const { session } = useAuth(); const { progress, save } = useOnboarding();
 const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
 const legacy = returnTo === 'garden' || progress.step !== 'flower';
 const state = useProductData(useCallback(async () => { if (!legacy) await ensureRelationship(); return getProgram(session!.user.id); }, [session!.user.id, legacy]));
 const [detail, setDetail] = useState<FlowerId | null>(null);
 const [chosen, setChosen] = useState<FlowerId | null>(null);
 const [gardenOpen, setGardenOpen] = useState(false);
 const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
 const selected = findFlower(chosen ?? state.data?.selectedFlower ?? null);
 const flower = findFlower(detail);
 async function select(id: FlowerId) {
  if (busy) return; setBusy(true); setError(null);
  try { await chooseFlower(id); setChosen(id); setDetail(null); } catch (e) { await state.refresh(); setDetail(null); setError((e as Error).message); } finally { setBusy(false); }
 }
 async function start() { if (busy) return; setBusy(true); try { if (legacy) { router.dismissTo('/garden'); return; } const next = progress.intent === 'together' && state.data?.memberCount === 1 ? 'invite' : 'done'; if (await save({ step: next })) router.replace(next === 'invite' ? '/invite-partner' : '/today'); } finally { setBusy(false); } }
 const startLabel = legacy ? 'Continue' : progress.intent === 'together' ? 'Start growing together' : 'Start growing';
 const gardenPromise = <View style={{marginTop:10,marginBottom:18,padding:16,borderRadius:20,backgroundColor:'#F4EFE7',gap:8}}>
  <Text style={styles.eyebrow}>FROM DIGITAL TO REAL</Text>
  <Text style={[styles.cardTitle,{fontSize:19,lineHeight:25}]}>When your journey reaches bloom, we’ll plant the same species in the real Same Side Garden.</Text>
  <Text style={[styles.small,{lineHeight:19}]}>See the garden and the stories behind flowers growing there.</Text>
  <Pressable accessibilityRole="button" onPress={()=>setGardenOpen(true)} style={{minHeight:44,justifyContent:'center',alignSelf:'flex-start'}}><Text style={styles.label}>See the garden & couple stories →</Text></Pressable>
 </View>;
 return <Screen><Brand/>{legacy && <Button label="Back to Garden" secondary disabled={busy} onPress={() => router.dismissTo('/garden')}/>}<LoadState {...state}/>
  {!state.loading && state.data && (selected ? <><Text style={styles.eyebrow}>{chosen ? 'You chose' : 'Your shared'} {selected.name}</Text><Text style={styles.title}>{selected.meaning}</Text><BotanicalFlower flower={selected.id}/><Text style={styles.body}>This is the flower you’ll grow together.</Text>{!legacy&&gardenPromise}<Button label={startLabel} busy={busy} onPress={() => { void start(); }}/></>
  : !state.data.canChooseFlower ? <><Text style={styles.title}>One flower, together.</Text><Text style={styles.body}>Your shared flower choice isn’t available on this account yet. Your existing moments are safe.</Text><Button label="Continue" onPress={() => { router.dismissTo('/garden'); }}/></>
  : <><Text style={styles.eyebrow}>Choose what you’ll grow</Text><Text style={styles.title}>Every flower carries a story.</Text><Text style={styles.body}>Choose the one whose meaning feels like yours.</Text>{!legacy&&gardenPromise}
   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{flowers.map(f => <Pressable key={f.id} accessibilityRole="button" accessibilityLabel={`Discover ${f.name}`} onPress={() => setDetail(f.id)} style={{ width: '47%', flexGrow: 1, paddingVertical: 14, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.line, alignItems: 'center' }}><BotanicalFlower flower={f.id} size={128}/><Text style={styles.label}>{f.name}</Text><Text style={styles.small}>{f.meaning}</Text></Pressable>)}</View></>)}
  {!legacy && <SetupExit/>}
  {error && <Notice>{error}</Notice>}
  <Modal visible={!!flower} animationType="slide" onRequestClose={() => { if (!busy) setDetail(null); }}><Screen>{flower && <><Button label="Close flower details" secondary disabled={busy} onPress={() => setDetail(null)}/><Text style={styles.eyebrow}>{flower.botanical}</Text><Text style={styles.title}>{flower.name}</Text><BotanicalFlower flower={flower.id}/><Text style={styles.cardTitle}>{flower.meaning}</Text><Text style={styles.body}>{flower.story}</Text>{error && <Notice>{error}</Notice>}<Button label={`Choose ${flower.name}`} busy={busy} onPress={() => { void select(flower.id); }}/><Button label="Back to flowers" secondary disabled={busy} onPress={() => setDetail(null)}/></>}</Screen></Modal>
  <CommunityGarden visible={gardenOpen} close={()=>setGardenOpen(false)}/>
 </Screen>;
}
