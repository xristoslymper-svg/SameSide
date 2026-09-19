import { supabase } from '../lib/supabase';

// Provisional editorial content and replaceable sprite positions, kept together.
export const flowers = [
 { id: 'cosmos', name: 'Cosmos', botanical: 'Cosmos bipinnatus', meaning: 'Harmony', story: 'Its name echoes the Greek kosmos: order and harmony. The open, balanced petals offer a small picture of things finding their place.', cell: 0 },
 { id: 'forget-me-not', name: 'Forget-me-not', botanical: 'Myosotis', meaning: 'Remembrance', story: 'These little blue flowers are often given as a token of remembrance. Even their common name is a wish to keep someone close across distance.', cell: 1 },
 { id: 'zinnia', name: 'Zinnia', botanical: 'Zinnia elegans', meaning: 'Lasting affection', story: 'Zinnias keep producing bright flowers through the warmer months. In our garden, that generous return stands for affection that keeps finding a way to show itself.', cell: 2 },
 { id: 'daisy', name: 'Daisy', botanical: 'Bellis perennis', meaning: 'New beginnings', story: 'A daisy opens towards the light, and its English name comes from “day’s eye”. We take that small daily opening as a symbol of beginning again.', cell: 3 },
 { id: 'calendula', name: 'Calendula', botanical: 'Calendula officinalis', meaning: 'Warmth', story: 'With petals from soft gold to deep orange, calendula brings the colour of sunshine close to the ground. Warmth is the story we give it here.', cell: 4 },
 { id: 'cornflower', name: 'Cornflower', botanical: 'Centaurea cyanus', meaning: 'Steadiness', story: 'Its clear blue flowers have long been familiar among summer fields. For this garden, they stand for a quiet, steady presence.', cell: 5 },
] as const;
export type FlowerId = typeof flowers[number]['id'];
export const findFlower = (id: string | null) => flowers.find(f => f.id === id);
export async function chooseFlower(flower: FlowerId) {
 if (!supabase) throw new Error('We couldn’t keep your flower choice. Please try again.');
 const { error } = await supabase.rpc('choose_shared_flower', { flower });
 if (error) throw new Error(error.message.includes('flower_already_chosen') ? 'Your flower has already been chosen. Reopen Garden to see it.' : 'We couldn’t keep your flower choice. Please try again.');
}
