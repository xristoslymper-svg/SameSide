import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Notice, Screen, styles } from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import { LoadState, useProductData } from '../../src/components/product';
import { getProgram } from '../../src/features/product';
import { readRoots, saveRoots, rootChoices, rootLabel, type RootChoice } from '../../src/features/roots';
import { useAuth } from '../../src/providers/AuthProvider';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { readReflection } from '../../src/features/reflections';
import { DailyReflection, TodaysRead } from '../../src/components/DailyNoticing';
import { theme } from '../../src/theme';

export default function Roots() {
  const { session } = useAuth();
  const { save, busy: inviting } = useOnboarding();
  const load = useCallback(async () => ({ program: await getProgram(session!.user.id), roots: await readRoots() }), [session!.user.id]);
  const state = useProductData(load);
  const reflection = useProductData(readReflection);
  const [editing, setEditing] = useState(false);
  const [choices, setChoices] = useState<RootChoice[]>([]);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (state.data) { setChoices(state.data.roots.choices); setEditing(false); setError(null); } }, [state.data]);
  const saved = !!state.data?.roots.choices.length && !editing;
  async function submit() {
    if (locked.current || !choices.length || choices.length > 2) return;
    locked.current = true; setBusy(true); setError(null);
    try { await saveRoots(choices); setEditing(false); await state.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { locked.current = false; setBusy(false); }
  }
  function toggle(choice: RootChoice) {
    setChoices(current => current.includes(choice) ? current.filter(value => value !== choice) : current.length < 2 ? [...current, choice] : current);
  }
  return <Screen><AppHeader/>
    <View style={{ marginTop: 26, gap: 8 }}>
      <Text style={styles.eyebrow}>Roots</Text>
      <Text style={[styles.title, { fontSize: 38, lineHeight: 43, letterSpacing: -1 }]}>Notice the little things.</Text>
      <Text style={styles.body}>A quiet space that’s only yours.</Text>
    </View>

    <LoadState {...state}/>
    {!state.loading && state.data && <>
      <LoadState {...reflection}/>
      {reflection.data && <View style={{ marginTop: 30 }}>
        <DailyReflection value={reflection.data}/>
      </View>}

      <View style={{ marginTop: 38, paddingTop: 28, borderTopWidth: 1, borderTopColor: theme.colors.line, gap: 12 }}>
        <Text style={styles.eyebrow}>Your roots right now</Text>
        {!saved && <Text style={[styles.cardTitle, { fontSize: 25, lineHeight: 31 }]}>What could you use a little more of?</Text>}
        {!saved && <Text style={styles.body}>Choose up to two. This stays private.</Text>}

        {saved ? <>
          <Text style={[styles.cardTitle, { fontSize: 25, lineHeight: 31 }]}>What you’re making room for</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {state.data.roots.choices.map(choice => <View key={choice} style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, backgroundColor: theme.colors.sageLight }}><Text style={styles.label}>{rootLabel(choice)}</Text></View>)}
          </View>
          <Text style={styles.small}>Private to you.</Text>
          {state.data.roots.can_edit && <Pressable accessibilityRole="button" onPress={() => { setChoices(state.data!.roots.choices); setEditing(true); }} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}><Text style={styles.label}>Change →</Text></Pressable>}
        </>
        : state.data.roots.can_edit ? <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{rootChoices.map(choice => {
            const selected = choices.includes(choice); const disabled = busy || (!selected && choices.length === 2);
            return <Pressable key={choice} accessibilityRole="button" accessibilityLabel={rootLabel(choice)} accessibilityState={{ selected, disabled }} aria-pressed={selected} disabled={disabled} onPress={() => toggle(choice)}
              style={{ width: '47%', flexGrow: 1, minHeight: 58, paddingHorizontal: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: selected ? theme.colors.sage : theme.colors.line, backgroundColor: selected ? theme.colors.sageLight : theme.colors.card, opacity: disabled && !busy ? 0.55 : 1 }}><Text style={styles.label}>{rootLabel(choice)}</Text></Pressable>;
          })}</View>
          <Button label="Keep these" disabled={!choices.length} busy={busy} onPress={() => { void submit(); }}/>
          {editing && <Button label="Cancel" secondary disabled={busy} onPress={() => { setEditing(false); setError(null); }}/>}
        </>
        : <Text style={styles.body}>This check-in has come to a close for The Routine.</Text>}
      </View>

      {error && <Notice>{error}</Notice>}

      {reflection.data && <View style={{ marginTop: 38, paddingTop: 28, borderTopWidth: 1, borderTopColor: theme.colors.line }}>
        <TodaysRead date={reflection.data.date}/>
      </View>}

      <View style={{ marginTop: 42, paddingTop: 26, paddingBottom: 12, borderTopWidth: 1, borderTopColor: theme.colors.line }}>
        <Text style={[styles.cardTitle, { fontSize: 21, lineHeight: 28 }]}>The garden grows from what you do.</Text>
        <Text style={[styles.body, { marginTop: 4 }]}>The roots grow from what you notice.</Text>
      </View>

      {state.data.program.memberCount === 1 && <View style={[styles.card, { marginTop: 22 }]}>
        <Text style={styles.eyebrow}>When you’re ready</Text>
        <Text style={styles.cardTitle}>Bring your partner in</Text>
        <Text style={styles.body}>You can begin here on your own. Invite them whenever it feels right.</Text>
        <Button label="Invite my partner" busy={inviting} onPress={() => { void save({ step: 'invite' }); }}/>
      </View>}
    </>}
  </Screen>;
}
