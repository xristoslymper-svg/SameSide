import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Image, View } from 'react-native';
import { findFlower, type FlowerId } from '../features/flowers';

import type { GrowthState } from '../features/growth';

// One replaceable botanical atlas; no contributor metadata or task information.
export function BotanicalFlower({ flower, state: stage, size = 280, label }: { flower: FlowerId; state?: GrowthState; size?: number; label?: string }) {
 const definition = findFlower(flower)!;
 const cell = stage?.cell ?? definition.cell;
 const fade = useRef(new Animated.Value(1)).current;
 useEffect(() => {
  let active = true;
  void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
   if (!active || reduced) return;
   fade.setValue(0.65); Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }).start();
  });
  return () => { active = false; fade.stopAnimation(); };
 }, [stage?.scale, stage?.stage, flower, fade]);
 return <Animated.View accessible accessibilityRole="image" accessibilityLabel={label ?? `${definition.name}${stage ? ': ' + stage.stage : ''}`} style={{ opacity: fade, alignSelf: 'center', transform: [{ scale: stage?.scale ?? 1 }] }}>
  <View style={{ width: size, height: size, overflow: 'hidden' }}>
   <Image source={require('../../assets/botanical-atlas.png')} style={{ position: 'absolute', width: size * 3, height: size * 3, left: -(cell % 3) * size, top: -Math.floor(cell / 3) * size }} resizeMode="stretch"/>
  </View>
 </Animated.View>;
}
