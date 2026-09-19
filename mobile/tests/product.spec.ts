import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { dateOnDay, growth, growthHistory, type GardenDay } from '../src/features/growth';

// UI/persistence coverage at the HTTP boundary. Real RLS is tested separately in PostgreSQL.
async function setup(context: BrowserContext, id: string, model: { members: number; completed: Set<string>; fail: boolean; issued?: Map<string, Set<number>>; roots?: Map<string, string[]>; reflections?: Map<string, string>; flower?: string | null; legacy?: boolean; programDay?: number; daily?: GardenDay[] }) {
  if (model.flower === undefined) model.flower = 'cosmos'; model.reflections ??= new Map();
  model.roots ??= new Map();
  model.issued ??= new Map();
  if (!model.issued.has(id)) model.issued.set(id, new Set());
  const issued = model.issued.get(id)!;
  const today = new Date().toISOString().slice(0,10);
  const startDate = () => dateOnDay(today, 2 - (model.programDay ?? 9));
  const history = () => {
    if(model.daily) return model.daily;
    const totals = new Map<string,number>();
    for(const key of model.completed) {
      const historical = /^(history|old|anonymous)-(\d+)$/.exec(key);
      const date = historical ? dateOnDay(startDate(), Math.min(Number(historical[2])+1,model.programDay??9)) : today;
      totals.set(date,(totals.get(date)??0)+1);
    }
    return [...totals].map(([garden_date,flower_count])=>({garden_date,flower_count}));
  };
  const move = (slot: number) => ({ id: `move-${id}-${slot}`, slot, assigned_for_date: today, task_title: slot ? ['','Make one thing lighter','Share a memory'][slot] : id === 'alex' ? 'Leave a kind note' : 'Make a little room', task_body: slot ? 'A small extra gesture of care.' : id === 'alex' ? 'Write something you appreciate.' : 'Put away your phone for a conversation.', task_minutes: 2, program_day: model.programDay ?? 9, status: model.completed.has(`${id}-${slot}`) ? 'completed' : 'assigned' });
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const enc = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const session = { access_token: `${enc({ alg: 'HS256' })}.${enc({ sub: id, exp: expires, role: 'authenticated' })}.test`, refresh_token: 'test', token_type: 'bearer', expires_in: 3600, expires_at: expires, user: { id, email: id + '@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } };
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': 'Content-Range' };
  await context.route('**/auth/v1/**', r => r.fulfill({ status: 200, json: r.request().url().includes('/user') ? session.user : session, headers }));
  await context.route('**/rest/v1/**', async r => {
    const req = r.request(); const path = new URL(req.url()).pathname;
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers });
    if (path.endsWith('/relationship_members')) return r.fulfill({ status: 200, json: req.method() === 'HEAD' ? undefined : [{ relationship_id: 'same-relationship', member_role: id === 'alex' ? 'member_a' : 'member_b' }], headers: { ...headers, 'content-range': `0-${model.members - 1}/${model.members}` } });
    if (path.endsWith('/relationships')) return r.fulfill({ status: 200, json: { active_path: 'routine', selected_flower: model.flower, legacy_flower_choice: model.legacy === true, timezone: 'UTC', path_started_at: startDate() }, headers });
    if (path.endsWith('/rpc/choose_shared_flower')) {
      if (model.flower && model.flower !== req.postDataJSON().flower) return r.fulfill({ status: 400, json: { message: 'flower_already_chosen' }, headers });
      model.flower = req.postDataJSON().flower; return r.fulfill({ status: 200, json: model.flower, headers });
    }
    if (model.fail) return r.fulfill({ status: 500, json: { message: 'internal database details' }, headers });
    if (path.endsWith('/rpc/get_my_daily_reflection')) return r.fulfill({ status: 200, json: { date: '2026-09-18', text: model.reflections!.get(id) ?? null }, headers });
    if (path.endsWith('/rpc/save_my_daily_reflection')) { const body = req.postDataJSON(); expect(Object.keys(body)).toEqual(['thought']); model.reflections!.set(id, body.thought); return r.fulfill({ status: 200, json: { date: '2026-09-18', text: body.thought }, headers }); }
    if (path.endsWith('/rpc/get_my_root_preferences')) return r.fulfill({ status: 200, json: { choices: model.roots!.get(id) ?? [], can_edit: true }, headers });
    if (path.endsWith('/rpc/save_my_root_preferences')) {
      const body = req.postDataJSON(); expect(Object.keys(body)).toEqual(['choices']);
      expect(body.choices.length).toBeGreaterThan(0); expect(body.choices.length).toBeLessThanOrEqual(2);
      model.roots!.set(id, [...body.choices].sort());
      return r.fulfill({ status: 200, json: { choices: model.roots!.get(id), can_edit: true }, headers });
    }
    if (path.endsWith('/rpc/get_or_create_today_assignment')) {
      if ((model.programDay??9)>28) return r.fulfill({status:400,json:{message:'path_not_available'},headers});
      const slot = req.postDataJSON().requested_slot;
      expect(slot).toBeGreaterThanOrEqual(0); expect(slot).toBeLessThanOrEqual(2);
      if (slot) expect(model.completed.has(`${id}-${slot - 1}`)).toBe(true);
      issued.add(slot);
      return r.fulfill({ status: 200, json: move(slot), headers });
    }
    if (path.endsWith('/task_assignments')) {
      const query = new URL(req.url()).searchParams;
      expect(query.get('user_id')).toBe('eq.' + id);
      expect(query.get('assigned_for_date')).toBe('eq.' + today);
      expect(query.get('contract_version')).toBe('eq.1');
      expect(query.get('order')).toBe('slot.desc'); expect(query.get('limit')).toBe('1');
      return r.fulfill({ status: 200, json: [move(Math.max(...issued))], headers });
    }
    if (path.endsWith('/rpc/complete_assignment')) {
      const assignment = req.postDataJSON().assignment_id;
      expect(assignment.startsWith(`move-${id}-`)).toBe(true);
      const slot = Number(assignment.split('-').at(-1)); expect(issued.has(slot)).toBe(true);
      model.completed.add(`${id}-${slot}`); return r.fulfill({ status: 200, body: 'null', headers });
    }
    if (path.endsWith('/rpc/get_shared_garden')) return r.fulfill({ status: 200, json: history(), headers });
    throw new Error('Unexpected product API: ' + path);
  });
}
async function login(page: Page, id: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Already have an account? Sign in' }).click();
  await page.getByLabel('Email address', { exact: true }).fill(id + '@example.test');
  await page.getByLabel('Test password', { exact: true }).fill('local-test-password');
  await page.getByRole('button', { name: 'Test sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/today$/);
}
async function tab(page: Page, name: string) { await page.getByRole('tab', { name: new RegExp(name) }).click(); }

test('solo primary move persists; completion grows garden; Roots invites; mobile tabs and errors work', async ({ context, page }) => {
  const model = { members: 1, completed: new Set<string>(), fail: false };
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await setup(context, 'alex', model); await page.setViewportSize({ width: 390, height: 844 }); await login(page, 'alex');
  await expect(page.getByText('Leave a kind note', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByText('Leave a kind note', { exact: true })).toBeVisible();
  await tab(page, 'Garden'); await expect(page.getByText('A little beginning.')).toBeVisible();
  await tab(page, 'Today'); await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('A little care, now part of your garden.')).toBeVisible();
  const bonus = await page.getByRole('button',{name:'Do one more',exact:true}).boundingBox();
  expect(bonus!.y + bonus!.height).toBeLessThan(768);
  await page.screenshot({path:'test-results/today-compact-mobile.png',fullPage:true});
  await page.reload(); await expect(page.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'See what grew →' }).click(); await expect(page.getByText('1 little moment has helped it grow.', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByText('1 little moment has helped it grow.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/garden-mobile.png', fullPage: true });
  model.fail = true; await tab(page, 'Today'); await tab(page, 'Garden');
  await expect(page.getByText('We could not load your garden. Please try again.')).toBeVisible();
  await expect(page.getByText('internal database details')).toHaveCount(0);
  model.fail = false; await page.getByRole('button', { name: 'Try again' }).click();
  await tab(page, 'Roots'); await expect(page.getByRole('button', { name: 'Invite my partner' })).toBeVisible();
  await expect(page.getByText('What could you use a little more of?', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'This feels right' })).toBeDisabled();
  await expect(page.getByLabel('New test password')).toHaveCount(0);
  await expect(page.getByText('alex@example.test')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Fun', exact: true }).click();
  await expect(page.getByRole('button', { name: 'This feels right' })).toBeEnabled();
  await page.getByRole('button', { name: 'Conversation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Affection', exact: true })).toBeDisabled();
  await page.screenshot({ path: 'test-results/roots-choices-mobile.png', fullPage: true });
  model.fail = true; await page.getByRole('button', { name: 'This feels right' }).click();
  await expect(page.getByText('We couldn’t save that just yet. Your choices are still here to try again.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fun', exact: true })).toHaveAttribute('aria-pressed', 'true');
  model.fail = false; await page.getByRole('button', { name: 'This feels right' }).click();
  await expect(page.getByText('Your roots right now', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByText('Your roots right now', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Conversation', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Fun', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Fun', exact: true }).click();
  await page.getByRole('button', { name: 'This feels right' }).click();
  await expect(page.getByText('Your roots right now', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByText('Conversation', { exact: true })).toBeVisible();
  await expect(page.getByText('Fun', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/roots-saved-mobile.png', fullPage: true });
  const thought = await page.getByText('A thought for today').locator('..').innerText();
  const prompt = await page.getByLabel('Your private thought').locator('..').innerText();
  await page.reload();
  await expect(page.getByText('A thought for today').locator('..')).toHaveText(thought, { useInnerText: true });
  await expect(page.getByLabel('Your private thought').locator('..')).toHaveText(prompt, { useInnerText: true });
  await page.getByLabel('Your private thought').fill('We laughed while making dinner.');
  await page.getByRole('button', {name:'Keep this thought'}).click();
  await expect(page.getByText('Kept private')).toBeVisible();
  await page.reload(); await expect(page.getByText('“We laughed while making dinner.”')).toBeVisible();
  await page.getByRole('button', {name:'Edit',exact:true}).click();
  await page.getByLabel('Your private thought').fill('A second thought.');
  await page.getByRole('button', {name:'Keep this thought'}).click();
  await expect(page.getByText('“A second thought.”')).toBeVisible();
  await page.getByRole('button',{name:'Read →',exact:true}).click();
  await expect(page.getByText('Something to notice today')).toBeVisible();
  await page.getByRole('button',{name:'Close reading'}).click();
  await page.getByRole('button',{name:'Visit the garden →'}).click();
  await expect(page.getByRole('img',{name:'Illustrative test garden'})).toBeVisible();
  expect(await page.getByRole('img',{name:'Illustrative test garden'}).evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await page.getByRole('button',{name:'Close garden story'}).click();
  await tab(page, 'Garden');
  await page.getByRole('button',{name:'Learn more →'}).click();
  await expect(page.getByRole('dialog').getByText('Something real begins.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close garden story'}).click();
  await tab(page, 'Today');
  await expect(page.getByText('A little care, now part of your garden.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Suggest another' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Do one more', exact: true }).click();
  await expect(page.getByText('Make one thing lighter', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByText('Make one thing lighter', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('A little care, now part of your garden.')).toBeVisible();
  await page.getByRole('button', { name: 'Do one more', exact: true }).click();
  await expect(page.getByText('Share a memory', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('That’s plenty for today.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Do one more', exact: true })).toHaveCount(0);
  await page.reload(); await expect(page.getByText('That’s plenty for today.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Do one more', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/today-done-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'See what grew →' }).click();
  await expect(page.getByText('3 little moments have helped it grow.', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('two accounts have different private moves, share growth, and retain completion after restart', async ({ browser }) => {
  const model = { members: 2, completed: new Set<string>(), fail: false };
  const a = await browser.newContext(); const b = await browser.newContext();
  await setup(a, 'alex', model); await setup(b, 'jamie', model);
  const pa = await a.newPage(); const pb = await b.newPage(); await login(pa, 'alex'); await login(pb, 'jamie');
  await expect(pa.getByText('Leave a kind note', { exact: true })).toBeVisible();
  await expect(pb.getByText('Make a little room', { exact: true })).toBeVisible();
  await expect(pb.getByText('Leave a kind note', { exact: true })).toHaveCount(0);
  await expect(pa.getByText('Week 2 · Add a little surprise')).toBeVisible(); await expect(pb.getByText('Week 2 · Add a little surprise')).toBeVisible();
  await pa.getByRole('button', { name: 'Done', exact: true }).click(); await expect(pa.getByRole('button', { name: 'See what grew →' })).toBeVisible();
  await tab(pb, 'Garden'); await expect(pb.getByText('1 little moment has helped it grow.', { exact: true })).toBeVisible();
  await tab(pb, 'Today'); await pb.getByRole('button', { name: 'Done', exact: true }).click(); await expect(pb.getByRole('button', { name: 'See what grew →' })).toBeVisible();
  await tab(pa, 'Garden'); await expect(pa.getByText('2 little moments have helped it grow.', { exact: true })).toBeVisible();
  await tab(pb, 'Garden'); await expect(pb.getByText('2 little moments have helped it grow.', { exact: true })).toBeVisible();
  for (const page of [pa, pb]) {
    await tab(page, 'Roots'); await expect(page.getByRole('button', { name: 'Invite my partner' })).toHaveCount(0);
    await page.getByRole('button', { name: page === pa ? 'Fun' : 'Affection', exact: true }).click();
    await page.getByRole('button', { name: 'This feels right' }).click();
    await expect(page.getByText('Your roots right now', { exact: true })).toBeVisible();
    await page.reload(); await expect(page.getByText(page === pa ? 'Fun' : 'Affection', { exact: true })).toBeVisible();
    await expect(page.getByText(page === pa ? 'Affection' : 'Fun', { exact: true })).toHaveCount(0);
    await tab(page, 'Today'); await page.reload(); await expect(page.getByText('A little care, now part of your garden.')).toBeVisible();
  }
  const saved = await b.storageState(); await b.close();
  const restarted = await browser.newContext({ storageState: saved }); await setup(restarted, 'jamie', model);
  const fresh = await restarted.newPage(); await fresh.goto('/today'); await expect(fresh.getByText('A little care, now part of your garden.')).toBeVisible();
  await restarted.close(); await a.close();
});


test('shared flower stages follow journey dates and are inherited by B', async ({context,page}) => {
 const today = new Date().toISOString().slice(0,10);
 const model = {members:2,completed:new Set<string>(),fail:false,flower:'zinnia',programDay:1,daily:[] as GardenDay[]};
 await setup(context,'jamie',model); await login(page,'jamie'); await tab(page,'Garden');
 await expect(page.getByRole('img',{name:'Zinnia: Seed',exact:true})).toBeVisible();
 for(const [day,stage] of [[3,'Roots'],[7,'Tiny shoot'],[14,'First leaves'],[21,'Established plant'],[23,'Bud'],[26,'Opening'],[28,'Full bloom']] as const) {
  model.programDay=day; const start=dateOnDay(today,2-day);
  model.daily=Array.from({length:day},(_,i)=>({garden_date:dateOnDay(start,i+1),flower_count:1}));
  await tab(page,'Today'); await tab(page,'Garden');
  await expect(page.getByRole('img',{name:'Zinnia: '+stage,exact:true})).toBeVisible();
 }
 await expect(page.getByText('Your Zinnia bloomed',{exact:true})).toBeVisible();
 await page.reload(); await expect(page.getByRole('img',{name:'Zinnia: Full bloom',exact:true})).toBeVisible();
});

test('scenario: legacy member B chooses a shared flower without losing seven moments', async ({ context, page }) => {
  const model = { members: 2, completed: new Set(Array.from({length:7}, (_,i) => 'history-'+i)), fail: false, flower: null as string | null, legacy: true };
  await setup(context, 'jamie', model); await page.setViewportSize({width:390,height:844}); await login(page,'jamie');
  await tab(page,'Garden');
  await expect(page.getByRole('img',{name:'Botanical preview — choose your shared flower'})).toBeVisible();
  await expect(page.getByText('7 little moments have helped it grow.')).toBeVisible();
  if (process.env.SAMESIDE_MANUAL === '1') await page.pause();
  await page.getByRole('button',{name:'Choose your flower',exact:true}).click();
  await expect(page).toHaveURL(/choose-flower\?returnTo=garden/);
  await page.getByRole('button',{name:'Back to Garden',exact:true}).click();
  await expect(page).toHaveURL(/\/garden$/);
  await page.getByRole('button',{name:'Choose your flower',exact:true}).click();
  await expect(page.getByRole('button',{name:/^Discover /})).toHaveCount(6);
  await page.getByRole('button',{name:'Discover Cosmos',exact:true}).click();
  await page.getByRole('button',{name:'Choose Cosmos',exact:true}).click();
  await expect(page.getByText('You chose Cosmos',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Start the shift'})).toHaveCount(0);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page).toHaveURL(/\/garden$/);
  await expect(page.getByRole('img',{name:'Cosmos: First leaves'})).toBeVisible();
  await expect(page.getByText('7 little moments have helped it grow.')).toBeVisible();
  await page.reload(); await expect(page.getByRole('img',{name:'Cosmos: First leaves'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Refresh garden'})).toHaveCount(0);
  expect(model.completed.size).toBe(7);
  await page.screenshot({path:'test-results/legacy-resolved-mobile.png',fullPage:true});
});

test('scenario: returning user stays in Garden on refresh; network fallback stays botanical', async ({ context, page }) => {
  const model = { members: 2, completed: new Set(Array.from({length:7}, (_,i) => 'history-'+i)), fail: false, flower: 'cosmos' };
  await setup(context,'jamie',model); await page.setViewportSize({width:390,height:844}); await login(page,'jamie');
  await tab(page,'Garden'); await page.reload();
  await expect(page).toHaveURL(/\/garden$/);
  await expect(page.getByRole('img',{name:'Cosmos: First leaves'})).toBeVisible();
  if (process.env.SAMESIDE_MANUAL === '1') await page.pause();
  model.fail = true; await tab(page,'Today'); await tab(page,'Garden');
  await expect(page.getByText('We could not load your garden. Please try again.')).toBeVisible();
  await expect(page.getByRole('img',{name:'Botanical preview — choose your shared flower'})).toBeVisible();
  model.fail = false;
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/rpc/get_shared_garden',async route => { await wait; await route.fallback(); });
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.getByRole('img',{name:'Botanical garden loading'})).toBeVisible();
  release(); await expect(page.getByRole('img',{name:'Cosmos: First leaves'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Choose your flower'})).toHaveCount(0);
});

// Manual fixtures are isolated from every remote service, including newly added APIs.
test.beforeEach(async ({ context }) => {
  if (process.env.SAMESIDE_MANUAL !== '1') return;
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === 'http://localhost:8081' ? route.continue() : route.abort();
  });
});

test('global Account, Same Side home and sign-out preserve returning state', async ({ context, page }) => {
 const model = {members:2,completed:new Set(['alex-0']),fail:false,flower:'cosmos'};
 await setup(context,'alex',model); await login(page,'alex');
 for (const name of ['Today','Garden','Roots']) {
  await tab(page,name); await page.getByRole('button',{name:'Account',exact:true}).click();
  await expect(page.getByText('alex@example.test',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Same Side — Today',exact:true}).click();
  await expect(page).toHaveURL(/\/today$/);
 }
 await page.getByRole('button',{name:'Account',exact:true}).click();
 await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await expect(page).toHaveURL(/:8081\/$/);
 await expect(page.getByRole('button',{name:'Start together',exact:true})).toBeVisible();
 await page.reload(); await expect(page.getByRole('button',{name:'Start together',exact:true})).toBeVisible();
 await login(page,'alex'); await expect(page.getByText('A little care, now part of your garden.')).toBeVisible();
 await tab(page,'Garden'); await expect(page.getByRole('img',{name:'Cosmos: Tiny shoot',exact:true})).toBeVisible();
 await expect(page.getByText('1 little moment has helped it grow.')).toBeVisible();
});

test('Garden replay stops at real growth, can close, and flower story has an exit', async ({ context, page }) => {
 const model = {members:2,completed:new Set(Array.from({length:7},(_,i)=>'old-'+i)),fail:false,flower:'cosmos'};
 await setup(context,'jamie',model); await page.setViewportSize({width:390,height:844}); await page.emulateMedia({reducedMotion:'no-preference'}); await login(page,'jamie'); await tab(page,'Garden');
 const writes:string[]=[];
 page.on('request',request=>{if(/\/rest\/v1\//.test(request.url()) && !/\/rpc\/(get_|preview_)/.test(request.url()) && ['POST','PATCH','DELETE'].includes(request.method())) writes.push(request.url());});
 await page.getByRole('button',{name:'Replay our growth →'}).click();
 await expect(page.getByRole('dialog').getByRole('img',{name:'Cosmos: Seed',exact:true})).toBeVisible();
 await expect(page.getByRole('dialog').getByRole('img',{name:'Cosmos: First leaves',exact:true})).toBeVisible({timeout:10000});
 await expect(page.getByRole('button',{name:'Close replay'})).toHaveCount(0,{timeout:11000});
 await expect(page.getByRole('img',{name:'Cosmos: First leaves',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Replay our growth →'}).click();
 await page.getByRole('button',{name:'Close replay'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'The story of your flower →'}).click();
 await expect(page.getByRole('dialog').getByText('Cosmos bipinnatus',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Close flower story'}).click();
 await page.getByRole('button',{name:'Learn more →'}).click();
 await page.getByRole('button',{name:'Close garden story'}).click();
 expect(writes).toEqual([]); expect(model.completed.size).toBe(7);
 await expect(page.getByText('7 little moments have helped it grow.')).toBeVisible();
 await page.screenshot({path:'test-results/garden-navigation-mobile.png',fullPage:true});
});

test('Garden seed has no replay; full bloom recognizes completion and reduced-motion replay is manual', async ({ context,page }) => {
 const model={members:2,completed:new Set<string>(),fail:false,flower:'zinnia',programDay:28,daily:[] as GardenDay[]};
 await setup(context,'jamie',model); await login(page,'jamie'); await tab(page,'Garden');
 await expect(page.getByRole('img',{name:'Zinnia: Seed',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Replay our growth →'})).toHaveCount(0);
 for(let i=0;i<28;i++) model.completed.add('old-'+i);
 const today = new Date().toISOString().slice(0,10);
 model.daily=Array.from({length:28},(_,i)=>({garden_date:dateOnDay(today,i-26),flower_count:1}));
 await tab(page,'Today'); await tab(page,'Garden');
 await expect(page.getByText('It bloomed',{exact:true})).toBeVisible();
 await expect(page.getByText('You grew this together.',{exact:true})).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Replay our growth →'}).click();
 const journey={startDate:dateOnDay(today,-26),today,days:model.daily};
 for(const frame of growthHistory(journey)) {
  await expect(page.getByRole('dialog').getByRole('img',{name:'Zinnia: '+frame.state.stage,exact:true})).toBeVisible();
  await page.getByRole('button',{name:frame.label==='Today'?'Back to Garden':'Next growth stage',exact:true}).click();
 }
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(model.completed.size).toBe(28);
});

for(const [day,counts,expected] of [
 [1,[0],'Seed'],[3,[1,1,1],'Roots'],[7,[2,1,2,1,1,1,1],'Tiny shoot'],
 [7,Array(7).fill(100),'Tiny shoot'],[21,Array(21).fill(1),'Established plant'],
 [42,Array(28).fill(1),'Full bloom'],[180,Array(28).fill(1),'Full bloom'],
] as const) test(`dated Garden day ${day}, ${counts.reduce((a,b)=>a+b,0)} actions matches replay and refresh`,async({context,page})=>{
 const today=new Date().toISOString().slice(0,10),startDate=dateOnDay(today,2-day);
 const daily=counts.map((flower_count,i)=>({garden_date:dateOnDay(startDate,i+1),flower_count}));
 const model={members:2,completed:new Set<string>(),fail:false,flower:'cosmos',programDay:day,daily};
 await page.emulateMedia({reducedMotion:'reduce'}); await page.setViewportSize({width:390,height:844});
 await setup(context,'jamie',model); await login(page,'jamie'); await tab(page,'Garden');
 const plant=page.getByRole('img',{name:'Cosmos: '+expected,exact:true});await expect(plant).toBeVisible();
 const visual=await plant.getAttribute('style');
 const frames=growthHistory({startDate,today,days:daily});
 if(growth({startDate,today,days:daily}).actions) {
  await page.getByRole('button',{name:'Replay our growth →'}).click();
  for(let i=0;i<frames.length;i++) {
   const frame=frames[i];
   await expect(page.getByRole('dialog').getByText(frame.label,{exact:true})).toBeVisible();
   if(i===frames.length-1) await expect(page.getByRole('dialog').getByRole('img',{name:'Cosmos: '+expected,exact:true})).toHaveAttribute('style',visual!);
   await page.getByRole('button',{name:i===frames.length-1?'Back to Garden':'Next growth stage',exact:true}).click();
  }
 } else await expect(page.getByRole('button',{name:'Replay our growth →'})).toHaveCount(0);
 await page.reload();await expect(plant).toBeVisible();await expect(plant).toHaveAttribute('style',visual!);
 if(day===7 && counts[0]===2) await page.screenshot({path:'test-results/day7-nine-actions.png',fullPage:true});
});

test('enter demo from Account and exit restores the real session and history',async({context,page})=>{
 const model={members:2,completed:new Set(['alex-0']),fail:false,flower:'cosmos'};
 await setup(context,'alex',model);await login(page,'alex');
 const realStorage=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
 await page.getByRole('button',{name:'Account',exact:true}).click();
 await page.getByRole('button',{name:'Explore demo — no sign-in'}).click();
 await expect(page.getByText('DEMO · Sample data only')).toBeVisible();
 await page.getByRole('button',{name:'Demo controls'}).click();
 await page.getByRole('button',{name:'Paired · Week 1',exact:true}).click();
 await expect(page.getByText('9 little moments have helped it grow.')).toBeVisible();
 await page.getByRole('button',{name:'Demo controls'}).click();
 await page.getByRole('button',{name:'Restart demo from beginning'}).click();
 await page.getByRole('button',{name:'Demo controls'}).click();
 await page.getByRole('button',{name:'Exit demo — return to real app'}).click();
 await expect(page).toHaveURL(/\/today$/);
 await expect(page.getByText('A little care, now part of your garden.')).toBeVisible();
 const restored=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
 expect(restored).toEqual(realStorage);expect(model.completed.size).toBe(1);
});
