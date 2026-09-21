import { useEffect, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { Button, Notice, Screen, styles } from './ui';
import { dailyIndex, thoughts, reads } from '../features/rootsContent';
import { saveReflection, type Reflection } from '../features/reflections';

export function DailyThought({ date }: { date: string }) {
 const thought = thoughts[dailyIndex(date, thoughts.length)];
 return <View style={{ gap: 14, paddingVertical: 14 }}><Text style={styles.eyebrow}>A thought for today</Text><Text style={styles.title}>{thought[0]}</Text><Text style={styles.body}>{thought[1]}</Text></View>;
}

function shortDate(date: string) {
 try { return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
 catch { return date; }
}

export function DailyReflection({ value, recent = [] }: { value: Reflection; recent?: Reflection[] }) {
 const [saved, setSaved] = useState(value);
 const [entries, setEntries] = useState(recent);
 const [text, setText] = useState(value.text ?? '');
 const [editing, setEditing] = useState(!value.text);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 useEffect(() => { setSaved(value); setText(value.text ?? ''); setEditing(!value.text); }, [value]);
 useEffect(() => { setEntries(recent); }, [recent]);
 async function keep() {
  if (busy || !text.trim()) return;
  setBusy(true); setError(null);
  try {
   const result = await saveReflection(text);
   setSaved(result); setText(result.text ?? ''); setEditing(false);
   setEntries(current => [result, ...current.filter(entry => entry.date !== result.date)].slice(0, 5));
  } catch (e) { setError((e as Error).message); }
  finally { setBusy(false); }
 }
 const older = entries.filter(entry => entry.text && entry.date !== saved.date).slice(0, 3);
 return <View style={[styles.card, { gap: 12, padding: 20 }]}>
  <Text style={styles.eyebrow}>PERSONAL DIARY</Text>
  <Text style={[styles.cardTitle, { fontSize: 22, lineHeight: 28 }]}>A space for whatever is on your mind.</Text>
  <Text style={[styles.small, { lineHeight: 19 }]}>Private to you. Write as much or as little as you like.</Text>
  {editing ? <>
    <TextInput accessibilityLabel="Your private diary entry" multiline maxLength={280} editable={!busy} value={text} onChangeText={setText} placeholder="What are you thinking or feeling today?" style={[styles.input, { minHeight: 128, textAlignVertical: 'top' }]}/>
    <Text style={styles.small}>{text.length}/280 · Only you can read this.</Text>
    <Button label={saved.text ? 'Save changes' : 'Save today’s entry'} busy={busy} disabled={!text.trim()} onPress={() => { void keep(); }}/>
    {saved.text && <Button label="Cancel edit" secondary disabled={busy} onPress={() => { setText(saved.text!); setEditing(false); }}/>} 
   </>
   : <>
    <Text style={[styles.small, { fontWeight: '700' }]}>TODAY’S ENTRY</Text>
    <Text style={[styles.body, { color: '#3E4C43' }]}>{saved.text}</Text>
    <Button label="Edit today’s entry" secondary onPress={() => setEditing(true)}/>
   </>}
  {older.length > 0 && <View style={{ borderTopWidth: 1, borderTopColor: '#E6DED3', paddingTop: 12, gap: 11 }}>
    <Text style={styles.eyebrow}>RECENT ENTRIES</Text>
    {older.map(entry => <View key={entry.date} style={{ gap: 3 }}><Text style={[styles.small, { fontWeight: '700' }]}>{shortDate(entry.date)}</Text><Text numberOfLines={2} style={[styles.small, { color: '#59655E' }]}>{entry.text}</Text></View>)}
   </View>}
  {error && <Notice>{error}</Notice>}
 </View>;
}

export function TodaysRead({ date }: { date: string }) {
 const [open, setOpen] = useState(false); const read = reads[dailyIndex(date, reads.length)];
 return <View style={{ gap: 14 }}><Text style={styles.eyebrow}>Today’s read · 2 min</Text><Text style={[styles.cardTitle,{fontSize:22,lineHeight:28}]}>{read.title}</Text><Button label="Read" onPress={() => setOpen(true)}/>
  <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen><Button label="Close reading" secondary onPress={() => setOpen(false)}/><Text style={styles.eyebrow}>A Same Side read · 2 min</Text><Text style={styles.title}>{read.title}</Text>{read.paragraphs.map((p, i) => <Text key={i} style={styles.body}>{p}</Text>)}<Text style={styles.eyebrow}>Something to notice today</Text><Text style={styles.cardTitle}>{read.notice}</Text><Text style={styles.small}>An invitation to notice. Nothing to complete.</Text></Screen></Modal>
 </View>;
}
