// Presentation helpers for The Routine's botanical journey.
// Shared production clients receive only a qualitative stage from the backend;
// exact relationship completion totals stay private to the server.
export type GardenDay = { garden_date: string; flower_count: number };
export type Journey = { startDate: string; today: string; days: GardenDay[] };
export const routineDays = 28;
const stages = [
 { key:'seed', day: 1, care: 0, stage: 'Seed', cell: 6, scale: 0.72, title: 'A little beginning.' },
 { key:'roots', day: 2, care: 1, stage: 'Roots', cell: 6, scale: 0.85, title: 'Quiet roots are taking hold.' },
 { key:'shoot', day: 4, care: 1, stage: 'Tiny shoot', cell: 7, scale: 0.35, title: 'A tiny shoot. A strong start.' },
 { key:'leaves', day: 8, care: 3, stage: 'First leaves', cell: 7, scale: 0.52, title: 'The first leaves are finding their light.' },
 { key:'established', day: 15, care: 7, stage: 'Established plant', cell: 7, scale: 0.76, title: 'Little by little, it’s becoming established.' },
 { key:'bud', day: 22, care: 12, stage: 'Bud', cell: 8, scale: 0.84, title: 'A bud is taking shape.' },
 { key:'opening', day: 25, care: 16, stage: 'Opening', cell: null, scale: 0.88, title: 'Your flower is beginning to open.' },
 { key:'bloom', day: 28, care: 18, stage: 'Full bloom', cell: null, scale: 0.97, title: 'Your flower is in bloom.' },
] as const;
export type SharedStageKey = typeof stages[number]['key'];
const DAY = 86400000;
function timestamp(date: string) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Missing journey date');
 const value = Date.parse(date + 'T00:00:00Z');
 if (!Number.isFinite(value)) throw new Error('Invalid journey date');
 return value;
}
export function journeyDay(start: string, date: string) { return Math.max(1, Math.floor((timestamp(date) - timestamp(start)) / DAY) + 1); }
export function dateOnDay(start: string, day: number) { return new Date(timestamp(start) + (day - 1) * DAY).toISOString().slice(0,10); }
export function relationshipDate(timezone: string, now = new Date()) {
 const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(now);
 const value = (type: string) => parts.find(p=>p.type===type)!.value;
 return `${value('year')}-${value('month')}-${value('day')}`;
}
export function sharedGrowth(key: SharedStageKey, day = 1) {
 const stage = stages.find(item=>item.key===key) ?? stages[0];
 return { ...stage, day, date:'', actions:0, week:Math.min(4,Math.max(1,Math.ceil(Math.min(day,28)/7))), bloom:key==='bloom', scale:stage.scale };
}
export function growth(journey: Journey, atDate = journey.today) {
 const date = atDate > journey.today ? journey.today : atDate;
 const day = journeyDay(journey.startDate, date);
 const byDate = new Map<string, number>();
 for (const row of journey.days) {
  if (row.garden_date < journey.startDate || row.garden_date > date || !Number.isFinite(row.flower_count) || row.flower_count <= 0) continue;
  byDate.set(row.garden_date, (byDate.get(row.garden_date) ?? 0) + Math.floor(row.flower_count));
 }
 let actions = 0, care = 0;
 for (const count of byDate.values()) {
  actions += count;
  care += 1 + Math.min(count - 1, 2) * 0.125;
 }
 let index = 0;
 for (let i = 1; i < stages.length; i++) if (day >= stages[i].day && care >= stages[i].care) index = i;
 const stage = stages[index];
 const next = stages[index + 1];
 const withinStage = next ? Math.min(1, Math.max(0, (Math.min(day, routineDays) - stage.day) / (next.day - stage.day))) : 1;
 return { ...stage, day, date, actions, week: Math.min(4, Math.ceil(day / 7)), bloom: index === stages.length - 1,
  scale: stage.scale + 0.03 * withinStage + 0.02 * Math.min(1, care / Math.max(1, stage.care + 3)) };
}
export type GrowthState = ReturnType<typeof growth>;
export type GrowthFrame = { label: string; state: GrowthState };
export function growthHistory(journey: Journey): GrowthFrame[] {
 const end = journeyDay(journey.startDate, journey.today);
 const baseline = growth({ ...journey, days: [] }, journey.startDate);
 const frames: GrowthFrame[] = [{label:'The beginning',state:baseline}];
 const candidates = new Set<number>([1,end]);
 if (end <= 7) for(let day=1;day<=end;day++) candidates.add(day);
 else {
  for(const stage of stages) if(stage.day<=end) candidates.add(stage.day);
  for(const row of journey.days) { const day=journeyDay(journey.startDate,row.garden_date); if(day<=end) candidates.add(day); }
  for(let day=Math.max(1,end-2);day<=end;day++) candidates.add(day);
 }
 const snapshots = [...candidates].sort((a,b)=>a-b).map(day=>growth(journey,dateOnDay(journey.startDate,day)));
 const important = snapshots.filter((state,i)=>end<=7 || i===0 || state.stage!==snapshots[i-1].stage || state.day>=end-2);
 const chosen = important.length > 8 ? [important[0],...important.slice(1,-3).slice(-4),...important.slice(-3)] : important;
 for(const state of chosen) {
  if(state.day===1 && state.actions===0 && end>1) continue;
  frames.push({label:state.day===end?'Today':`Day ${state.day}`,state});
 }
 return frames;
}
