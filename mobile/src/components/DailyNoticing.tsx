import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Notice, Screen, styles } from './ui';
import { dailyIndex, thoughts, reads } from '../features/rootsContent';
import { saveReflection, type Reflection } from '../features/reflections';
import { theme } from '../theme';

export function DailyThought({ date }: { date: string }) {
 const thought = thoughts[dailyIndex(date, thoughts.length)];
 return <View style={{ gap: 14, paddingVertical: 14 }}><Text style={styles.eyebrow}>A thought for today</Text><Text style={styles.title}>{thought[0]}</Text><Text style={styles.body}>{thought[1]}</Text></View>;
}

function shortDate(date: string) {
 try { return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
 catch { return date; }
}

export function DailyReflection({ value, recent = [] }: { value: Reflection; recent?: Reflection[] }) {
 const router = useRouter();
 const [saved, setSaved] = useState(value);
 const [entries, setEntries] = useState(recent);
 const [text, setText] = useState(value.text ?? '');
 const [editing, setEditing] = useState(!value.text);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 useEffect(() => {
  // Do not let a parent refresh with stale data erase an entry that was just saved locally.
  if (value.date !== saved.date || value.text !== null || !saved.text) {
   setSaved(value); setText(value.text ?? ''); setEditing(!value.text);
  }
 }, [value.date, value.text]);
 useEffect(() => { setEntries(recent); }, [recent]);
 async function keep() {
  if (busy || !text.trim()) return;
  setBusy(true); setError(null);
  try {
   const result = await saveReflection(text.trim());
   const kept = { ...result, text: result.text ?? text.trim() };
   setSaved(kept); setText(kept.text ?? ''); setEditing(false);
   setEntries(current => [kept, ...current.filter(entry => entry.date !== kept.date)].slice(0, 5));
  } catch (e) { setError((e as Error).message); }
  finally { setBusy(false); }
 }
 const older = entries.filter(entry => entry.text && entry.date !== saved.date).slice(0, 2);
 return <View style={[styles.card, { gap: 14, padding: 20 }]}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
   <Text style={styles.eyebrow}>PERSONAL DIARY</Text>
   <Text style={[styles.small,{color:theme.colors.muted}]}>🔒 Private</Text>
  </View>
  {editing ? <>
    <TextInput accessibilityLabel="Your private diary entry" multiline editable={!busy} value={text} onChangeText={setText} placeholder="What’s on your mind today?" style={[styles.input, { minHeight: 118, textAlignVertical: 'top' }]}/>
    <View style={{flexDirection:'row',gap:10,alignItems:'center'}}>
     <View style={{flex:1}}><Button label={saved.text ? 'Save changes' : 'Save entry'} busy={busy} disabled={!text.trim()} onPress={() => { void keep(); }}/></View>
     {saved.text && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setText(saved.text!); setEditing(false); }} style={{padding:10}}><Text style={{fontSize:13,fontWeight:'700',color:theme.colors.muted}}>Cancel</Text></Pressable>}
    </View>
   </>
   : <View style={{gap:11}}>
    <Text style={[styles.small,{fontWeight:'700',color:theme.colors.muted}]}>{shortDate(saved.date)}</Text>
    <Text style={[styles.body, { color: theme.colors.inkSoft, lineHeight: 23 }]}>{saved.text}</Text>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
     <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={{paddingVertical:5,paddingRight:12}}><Text style={{fontSize:13,fontWeight:'700',color:theme.colors.sage}}>Edit</Text></Pressable>
     <Pressable accessibilityRole="button" onPress={() => router.push('/diary')} style={{paddingVertical:5,paddingLeft:12}}><Text style={{fontSize:13,fontWeight:'700',color:theme.colors.sage}}>View diary →</Text></Pressable>
    </View>
   </View>}
  {older.length > 0 && !editing && <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 12, gap: 9 }}>
    {older.map(entry => <View key={entry.date} style={{ gap: 2 }}><Text style={[styles.small, { fontWeight: '700' }]}>{shortDate(entry.date)}</Text><Text numberOfLines={1} style={[styles.small, { color: theme.colors.muted }]}>{entry.text}</Text></View>)}
   </View>}
  {!saved.text && !editing && <Pressable accessibilityRole="button" onPress={() => setEditing(true)}><Text style={{fontSize:13,fontWeight:'700',color:theme.colors.sage}}>Write an entry</Text></Pressable>}
  {error && <Notice>{error}</Notice>}
 </View>;
}

export function TodaysRead({ date }: { date: string }) {
 const [open, setOpen] = useState(false); const read = reads[dailyIndex(date, reads.length)];
 return <View style={{ gap: 14 }}><Text style={styles.eyebrow}>Today’s read · 2 min</Text><Text style={[styles.cardTitle,{fontSize:22,lineHeight:28}]}>{read.title}</Text><Button label="Read" onPress={() => setOpen(true)}/>
  <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen><Button label="Close reading" secondary onPress={() => setOpen(false)}/><Text style={styles.eyebrow}>A Same Side read · 2 min</Text><Text style={styles.title}>{read.title}</Text>{read.paragraphs.map((p, i) => <Text key={i} style={styles.body}>{p}</Text>)}<Text style={styles.eyebrow}>Something to notice today</Text><Text style={styles.cardTitle}>{read.notice}</Text><Text style={styles.small}>An invitation to notice. Nothing to complete.</Text></Screen></Modal>
 </View>;
}
