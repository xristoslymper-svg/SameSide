import { useEffect, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { Button, Notice, Screen, styles } from './ui';
import { dailyIndex, thoughts, prompts, reads } from '../features/rootsContent';
import { saveReflection, type Reflection } from '../features/reflections';
import { theme } from '../theme';

export function DailyThought({ date }: { date: string }) {
 const thought = thoughts[dailyIndex(date, thoughts.length)];
 return <View style={{ gap: 14, paddingVertical: 14 }}><Text style={styles.eyebrow}>A thought for today</Text><Text style={styles.title}>{thought[0]}</Text><Text style={styles.body}>{thought[1]}</Text></View>;
}
export function DailyReflection({ value }: { value: Reflection }) {
 const [saved, setSaved] = useState(value); const [text, setText] = useState(value.text ?? '');
 const [editing, setEditing] = useState(!value.text); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
 useEffect(() => { setSaved(value); setText(value.text ?? ''); setEditing(!value.text); }, [value]);
 async function keep() {
  if (busy || !text.trim()) return; setBusy(true); setError(null);
  try { const result = await saveReflection(text); setSaved(result); setText(result.text ?? ''); setEditing(false); }
  catch (e) { setError((e as Error).message); } finally { setBusy(false); }
 }
 return <View style={{ gap: 16, paddingVertical: 26, borderTopWidth: 1, borderTopColor: theme.colors.line }}><Text style={styles.eyebrow}>A moment for you</Text>
  {editing ? <><Text style={styles.cardTitle}>{prompts[dailyIndex(saved.date, prompts.length)]}</Text><Text style={styles.body}>Two sentences. Just for you.</Text><TextInput accessibilityLabel="Your private thought" multiline maxLength={280} editable={!busy} value={text} onChangeText={setText} placeholder="A little thing you noticed…" style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}/><Text style={styles.small}>{text.length}/280 · Only you can read this.</Text><Button label="Keep this thought" busy={busy} disabled={!text.trim()} onPress={() => { void keep(); }}/>{saved.text && <Button label="Cancel edit" secondary disabled={busy} onPress={() => { setText(saved.text!); setEditing(false); }}/>}</>
  : <><Text style={styles.eyebrow}>Today</Text><Text style={styles.cardTitle}>“{saved.text}”</Text><Text style={styles.small}>Kept private</Text><Button label="Edit" secondary onPress={() => setEditing(true)}/></>}
  {error && <Notice>{error}</Notice>}
 </View>;
}
export function TodaysRead({ date }: { date: string }) {
 const [open, setOpen] = useState(false); const read = reads[dailyIndex(date, reads.length)];
 return <View style={{ gap: 16, paddingVertical: 26, borderTopWidth: 1, borderTopColor: theme.colors.line }}><Text style={styles.eyebrow}>Today’s read · 2 min</Text><Text style={styles.cardTitle}>{read.title}</Text><Button label="Read →" secondary onPress={() => setOpen(true)}/>
  <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen><Button label="Close reading" secondary onPress={() => setOpen(false)}/><Text style={styles.eyebrow}>A Same Side read · 2 min</Text><Text style={styles.title}>{read.title}</Text>{read.paragraphs.map((p, i) => <Text key={i} style={styles.body}>{p}</Text>)}<Text style={styles.eyebrow}>Something to notice today</Text><Text style={styles.cardTitle}>{read.notice}</Text><Text style={styles.small}>An invitation to notice. Nothing to complete.</Text></Screen></Modal>
 </View>;
}
