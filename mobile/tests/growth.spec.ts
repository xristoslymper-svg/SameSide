import { test, expect } from '@playwright/test';
import { growth, growthHistory, dateOnDay, relationshipDate, type Journey } from '../src/features/growth';

const startDate='2026-01-01';
function journey(day:number, counts:number[]):Journey {
 return {startDate,today:dateOnDay(startDate,day),days:counts.map((flower_count,i)=>({garden_date:dateOnDay(startDate,i+1),flower_count}))};
}
for(const [name,day,counts,stage] of [
 ['Day 1 / no actions',1,[0],'Seed'],
 ['Day 3 / three actions',3,[1,1,1],'Roots'],
 ['Day 7 / nine actions',7,[2,1,2,1,1,1,1],'Tiny shoot'],
 ['Day 7 / extreme actions',7,Array(7).fill(100),'Tiny shoot'],
 ['Week 3 / consistent',21,Array(21).fill(1),'Established plant'],
 ['Week 4 / bud',23,Array(23).fill(1),'Bud'],
 ['Week 4 / opening',26,Array(26).fill(1),'Opening'],
 ['Routine complete',28,Array(28).fill(1),'Full bloom'],
 ['Week 6 / completed Routine',42,Array(28).fill(1),'Full bloom'],
 ['Long-term completed Routine',180,Array(28).fill(1),'Full bloom'],
 ['High count on one day is not sustained care',28,[1000],'Tiny shoot'],
] as const) {
 test(name+' — history and replay end at the exact live state',()=>{
  const input=journey(day,[...counts]); const before=JSON.stringify(input);
  const live=growth(input); expect(live.stage).toBe(stage);
  const frames=growthHistory(input);
  expect(frames.at(-1)!.label).toBe('Today'); expect(frames.at(-1)!.state).toEqual(live);
  for(const frame of frames.slice(1)) expect(frame.state).toEqual(growth(input,frame.state.date));
  expect(frames.length).toBeLessThanOrEqual(9);
  expect(JSON.stringify(input)).toBe(before);
  expect(growth(JSON.parse(before))).toEqual(live);
 });
}
test('extra partner/bonus actions enrich early growth but cannot jump developmental gates',()=>{
 const single=growth(journey(7,Array(7).fill(1))),couple=growth(journey(7,Array(7).fill(6)));
 expect(single.stage).toBe('Tiny shoot'); expect(couple.stage).toBe(single.stage);
 expect(couple.scale).toBeGreaterThanOrEqual(single.scale);
});
test('historical frames use real daily totals, not interpolated event counts',()=>{
 const frames=growthHistory(journey(7,[2,0,1,0,3,1,2]));
 expect(frames.map(f=>f.state.actions)).toEqual([0,2,2,3,3,6,7,9]);
 expect(frames.map(f=>f.label)).toEqual(['The beginning','Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Today']);
});
test('ignore other journeys/future totals, sort dates, combine duplicates, preserve no-decay',()=>{
 const input=journey(7,[1,1,1]);
 input.days.push({garden_date:'2025-12-31',flower_count:100},{garden_date:'2026-01-08',flower_count:100});
 expect(growth(input).actions).toBe(3);
 expect(growth({...input,days:[...input.days].reverse()})).toEqual(growth(input));
 expect(growth(journey(28,[1,1,1])).scale).toBeGreaterThanOrEqual(growth(journey(14,[1,1,1])).scale);
 const split=journey(3,[1,1,1]);split.days.push({garden_date:'2026-01-01',flower_count:1});
 expect(growth(split)).toEqual(growth(journey(3,[2,1,1])));
});
test('relationship calendar dates handle midnight and DST without 24-hour duration assumptions',()=>{
 expect(relationshipDate('Pacific/Kiritimati',new Date('2026-01-01T12:00:00Z'))).toBe('2026-01-02');
 expect(relationshipDate('America/Los_Angeles',new Date('2026-01-01T02:00:00Z'))).toBe('2025-12-31');
 expect(growth({startDate:'2026-03-07',today:'2026-03-09',days:[]}).day).toBe(3);
});
