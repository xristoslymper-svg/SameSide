import { useCallback, useState } from 'react';
import { useInvitation } from '../src/providers/InvitationProvider';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { Brand, Button, Notice, Screen, styles } from '../src/components/ui';
import { BotanicalFlower } from '../src/components/BotanicalFlower';
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
 const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
 const selected = findFlower(state.data?.selectedFlower ?? null);
 const flower = findFlower(detail);
 async function select(id: FlowerId) {
  if (busy) return; setBusy(true); setError(null);
  try {
   await chooseFlower(id);
   setDetail(null);
   if (legacy) { router.dismissTo('/garden'); return; }
   const next = progress.intent === 'together' && state.data?.memberCount === 1 ? 'invite' : 'done';
   if (await save({ step: next })) router.replace(next === 'invite' ? '/invite-partner' : '/today');
  } catch (e) { await state.refresh(); setDetail(null); setError((e as Error).message); } finally { setBusy(false); }
 }
 return <Screen><Brand/>{legacy && <Button label="Back to Garden" secondary disabled={busy} onPress={() => router.dismissTo('/garden')}/>}<LoadState {...state}/>
  {!state.loading && state.data && (legacy&&selected ? <><Text style={styles.eyebrow}>Your shared {selected.name}</Text><Text style={[styles.title,{fontSize:38,lineHeight:43}]}>{selected.meaning}</Text><BotanicalFlower flower={selected.id}/><Text style={styles.body}>This is the flower you’re growing together.</Text><Button label="Back to Garden" busy={busy} onPress={() => router.dismissTo('/garden')}/></>
  : !state.data.canChooseFlower ? <><Text style={[styles.title,{fontSize:38,lineHeight:43}]}>One flower, together.</Text><Text style={styles.body}>Your shared flower choice isn’t available on this account yet. Your existing moments are safe.</Text><Button label="Continue" onPress={() => router.dismissTo('/garden')}/></>
  : <><Text style={styles.eyebrow}>Choose what you’ll grow</Text><Text style={[styles.title,{fontSize:38,lineHeight:43}]}>Every flower carries a story.</Text><Text style={styles.body}>Choose the one whose meaning feels like yours. You’ll only choose once.</Text>
   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{flowers.map(f => <Pressable key={f.id} accessibilityRole="button" accessibilityLabel={`Discover ${f.name}`} onPress={() => setDetail(f.id)} style={{ width: '47%', flexGrow: 1, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.line, alignItems: 'center' }}><BotanicalFlower flower={f.id} size={116}/><Text style={styles.label}>{f.name}</Text><Text style={styles.small}>{f.meaning}</Text></Pressable>)}</View></>)}
  {!legacy && <SetupExit/>}
  {error && <Notice>{error}</Notice>}
  <Modal visible={!!flower} animationType="slide" onRequestClose={() => { if (!busy) setDetail(null); }}><Screen>{flower && <><Button label="Close flower details" secondary disabled={busy} onPress={() => setDetail(null)}/><Text style={styles.eyebrow}>{flower.botanical}</Text><Text style={[styles.title,{fontSize:38,lineHeight:43}]}>{flower.name}</Text><BotanicalFlower flower={flower.id}/><Text style={styles.cardTitle}>{flower.meaning}</Text><Text style={styles.body}>{flower.story}</Text>{error && <Notice>{error}</Notice>}<Button label={`Choose ${flower.name}`} busy={busy} onPress={() => { void select(flower.id); }}/><Button label="Back to flowers" secondary disabled={busy} onPress={() => setDetail(null)}/></>}</Screen></Modal>
 </Screen>;
}
