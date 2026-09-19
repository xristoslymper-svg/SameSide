import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Modal, Text } from 'react-native';
import { BotanicalFlower } from './BotanicalFlower';
import { Button, Screen, styles } from './ui';
import { findFlower, type FlowerId } from '../features/flowers';

import { growthHistory, type Journey } from '../features/growth';

// Presentation-only snapshot of the CURRENT journey. Never writes product data.
export function GrowthReplay({ flower, journey, close }: { flower: FlowerId; journey: Journey; close: () => void }) {
 const [step, setStep] = useState(0);
 const [reduced, setReduced] = useState<boolean | null>(null);
 const frames = useMemo(() => growthHistory(journey), [journey]);
 useEffect(() => {
  let active = true;
  void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); }, () => { if (active) setReduced(true); });
  const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
  return () => { active = false; listener.remove(); };
 }, []);
 useEffect(() => {
  if (reduced === null || reduced) return;
  const timer = setTimeout(() => { if (step === frames.length - 1) close(); else setStep(value => value + 1); }, Math.max(900, 7200 / frames.length));
  return () => clearTimeout(timer);
 }, [step, frames.length, reduced, close]);
 const displayed = frames[step];
 return <Modal visible animationType="none" onRequestClose={close}><Screen compact>
  <Button label="Close replay" secondary onPress={close}/>
  <Text style={[styles.eyebrow, { textAlign: 'center', marginTop: 24 }]}>Our growth</Text>
  <Text style={[styles.cardTitle, { textAlign: 'center', marginTop: 12 }]}>Your {findFlower(flower)!.name}</Text>
  <Text style={[styles.eyebrow, { textAlign: 'center', marginTop: 16 }]}>{displayed.label}</Text>
  <BotanicalFlower flower={flower} state={displayed.state}/>
  <Text style={[styles.small, {textAlign:'center',marginBottom:12}]}>{displayed.label === 'Today' ? 'Week ' + displayed.state.week + ' · ' : ''}{displayed.state.actions} actions together</Text>
  <Text accessibilityLiveRegion="polite" style={[styles.body, { textAlign: 'center', marginBottom: 16 }]}>{displayed.state.title}</Text>
  {reduced && <Button label={step === frames.length - 1 ? 'Back to Garden' : 'Next growth stage'} secondary onPress={() => { if (step === frames.length - 1) close(); else setStep(value => value + 1); }}/ >}
 </Screen></Modal>;
}
