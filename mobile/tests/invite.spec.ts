import { test, expect, type BrowserContext, type Route } from '@playwright/test';

const A = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'alex@example.test' };
const B = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', email: 'jamie@example.test' };
const relationshipId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const token = '1'.repeat(64);
const model = { flower: null as string | null, name: '', token: '', members: new Set<string>(), creations: [] as string[], acceptanceError: false, membershipError: false };
function session(user: typeof A) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return { access_token: `${encode({ alg: 'HS256' })}.${encode({ sub: user.id, exp: expires, role: 'authenticated' })}.test`, refresh_token: `refresh-${user.id}`, token_type: 'bearer', expires_in: 3600, expires_at: expires, user: { ...user, aud: 'authenticated', role: 'authenticated', created_at: new Date().toISOString(), app_metadata: {}, user_metadata: {} } };
}
const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': 'Content-Range', 'content-type': 'application/json' };
async function backend(context: BrowserContext, user: typeof A) {
  await context.route('**/auth/v1/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path.endsWith('/otp')) { expect(req.postDataJSON().email).toBe(user.email); return route.fulfill({ status: 200, json: {}, headers }); }
    if (path.endsWith('/token')) return route.fulfill({ status: 200, json: session(user), headers });
    if (path.endsWith('/user')) return route.fulfill({ status: 200, json: session(user).user, headers });
    if (path.endsWith('/logout')) return route.fulfill({ status: 204, headers });
    throw new Error(`Unexpected auth request ${path}`);
  });
  await context.route('**/rest/v1/**', async route => rest(route, user));
}
async function rest(route: Route, user: typeof A) {
  const req = route.request(); const url = new URL(req.url()); const path = url.pathname;
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
  if (path.endsWith('/rpc/preview_relationship_invite')) {
    const supplied = req.postDataJSON().raw_token;
    const state = supplied === model.token && model.members.size < 2 ? 'ready' : supplied === model.token ? 'full' : 'invalid';
    return route.fulfill({ status: 200, json: [{ invite_state: state, display_name: state === 'ready' ? model.name : null }], headers });
  }
  if (path.endsWith('/rpc/create_solo_relationship')) { model.creations.push(user.id); model.members.add(user.id); return route.fulfill({ status: 200, body: JSON.stringify(relationshipId), headers }); }
  if (path.endsWith('/rpc/create_relationship_invite')) { model.token = token; return route.fulfill({ status: 200, body: JSON.stringify(token), headers }); }
  if (path.endsWith('/rpc/accept_relationship_invite')) {
    if (model.acceptanceError) return route.fulfill({ status: 400, json: { message: 'already_in_relationship' }, headers });
    expect(req.postDataJSON().raw_token).toBe(model.token);
    model.members.add(user.id); return route.fulfill({ status: 200, body: JSON.stringify(relationshipId), headers });
  }
  if (path.endsWith('/profiles') && req.method() === 'PATCH') { model.name = req.postDataJSON().display_name; return route.fulfill({ status: 204, headers }); }
  if (path.endsWith('/relationship_members') && req.method() === 'HEAD') return route.fulfill({ status: 200, headers: { ...headers, 'content-range': `0-${model.members.size - 1}/${model.members.size}` } });
  if (path.endsWith('/relationship_members') && req.method() === 'GET') return route.fulfill({ status: model.membershipError ? 500 : 200, json: model.membershipError ? { message: 'unavailable' } : model.members.has(user.id) ? [{ relationship_id: relationshipId, member_role: user.id === A.id ? 'member_a' : 'member_b' }] : [], headers });
  if (path.endsWith('/rpc/choose_shared_flower')) { model.flower = req.postDataJSON().flower; return route.fulfill({status:200,json:model.flower,headers}); }
  if (path.endsWith('/rpc/get_my_daily_reflection')) return route.fulfill({status:200,json:{date:'2026-09-18',text:null},headers});
  if (path.endsWith('/rpc/get_my_root_preferences')) return route.fulfill({ status: 200, json: { choices: [], can_edit: true }, headers });
  if (path.endsWith('/relationships')) return route.fulfill({ status: 200, json: { active_path: 'routine', path_started_at: new Date().toISOString().slice(0,10), timezone:'UTC', selected_flower: model.flower }, headers });
  if (path.endsWith('/rpc/get_or_create_today_assignment')) return route.fulfill({ status: 200, json: { id: 'move-' + user.id, task_title: 'A kind note', task_body: 'Leave a kind note.', task_minutes: 2, program_day: 1, status: 'assigned' }, headers });
  throw new Error(`Unexpected product request ${req.method()} ${path}`);
}
async function authenticate(page: import('@playwright/test').Page, user: typeof A, code: string) {
  await page.getByLabel('Email address', { exact: true }).fill(user.email);
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await expect(page.getByText('Check your email', { exact: true })).toBeVisible();
  await page.goto(`/auth/callback?code=${code}`, { waitUntil: 'domcontentloaded' });
}

test.beforeEach(() => { model.flower = null; model.name = ''; model.token = ''; model.members.clear(); model.creations = []; model.acceptanceError = false; model.membershipError = false; });

for (const method of ['magic-link', 'password']) {
test(`${method}: two accounts pair through an invitation and remain paired after refresh`, async ({ browser }) => {
  const a = await browser.newContext(); await backend(a, A); const pageA = await a.newPage();
  await pageA.goto('/'); await pageA.getByRole('button', { name: 'Start together', exact: true }).click();
  await pageA.getByRole('button', { name: 'Continue', exact: true }).click(); await pageA.getByRole('button', { name: 'Continue', exact: true }).click();
  await authenticate(pageA, A, 'a-code');
  await pageA.getByRole('button', { name: 'Choose The Routine' }).click(); await pageA.getByRole('button', { name: 'Choose your flower', exact: true }).click();
  await pageA.getByRole('button',{name:'Discover Cosmos',exact:true}).click();
  await pageA.getByRole('button',{name:'Choose Cosmos',exact:true}).click();
  await pageA.getByRole('button', { name: 'Start the shift' }).click();
  await expect(pageA.getByText('Invite your partner', { exact: true })).toBeVisible();
  await pageA.getByLabel('Your first name').fill('Alex'); await pageA.getByRole('button', { name: 'Invite my partner' }).click();
  const link = await pageA.getByText(/\/invite\/1{64}$/).textContent(); expect(link).toBeTruthy();

  const b = await browser.newContext(); await backend(b, B); const pageB = await b.newPage(); await pageB.goto(link!);
  await expect(pageB.getByText('Alex invited you', { exact: true })).toBeVisible();
  await pageB.getByRole('button', { name: 'Join Alex' }).click();
  await expect(pageB.getByText('Join Alex on Same Side', { exact: true })).toBeVisible();
  await pageB.reload();
  if (method === 'magic-link') await authenticate(pageB, B, 'b-code');
  else {
    await pageB.getByLabel('Email address', { exact: true }).fill(B.email);
    await pageB.getByLabel('Test password', { exact: true }).fill('test-only-password');
    await pageB.getByRole('button', { name: 'Test sign in', exact: true }).click();
  }
  await expect(pageB.getByText("You're on the same side", { exact: true })).toBeVisible();
  await pageB.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(pageB.getByText('Today', { exact: true }).first()).toBeVisible();
  await pageB.evaluate(userId => localStorage.setItem(`same-side.onboarding.v1.${userId}`, JSON.stringify({ version: 1, step: 'invite', intent: 'together', path: 'routine', focus: null })), B.id);
  await pageB.reload(); await expect(pageB.getByText('Today', { exact: true }).first()).toBeVisible();

  // A never entered a waiting room or advanced local onboarding; backend membership wins on refresh.
  await pageA.reload(); await expect(pageA.getByText('Today', { exact: true }).first()).toBeVisible();
  expect(model.members).toEqual(new Set([A.id, B.id]));
  expect(model.creations).toEqual([A.id]);
  await expect(pageB.getByRole('button', { name: 'Invite your partner', exact: true })).toHaveCount(0);
  await expect(pageA.getByRole('button', { name: 'Invite your partner', exact: true })).toHaveCount(0);
  await a.close(); await b.close();
});
}

test('acceptance failure stays in invitation, and retry joins without creating a solo relationship', async ({ browser }) => {
  model.name = 'Alex'; model.token = token; model.members.add(A.id); model.acceptanceError = true;
  const context = await browser.newContext(); await backend(context, B); const page = await context.newPage();
  await page.goto('/invite/' + token);
  await page.getByRole('button', { name: 'Join Alex' }).click();
  await authenticate(page, B, 'b-error-code');
  await expect(page.getByText('This account is already connected to a relationship.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('This account is already connected to a relationship.')).toBeVisible();
  expect(model.creations).toEqual([]);
  model.acceptanceError = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText("You're on the same side", { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  model.membershipError = true;
  await page.reload();
  await expect(page.getByText('We could not load your account and relationship. Please try again.')).toBeVisible();
  model.membershipError = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible();
  expect(model.creations).toEqual([]);
  await context.close();
});

test('returning solo member skips stale onboarding and may invite voluntarily', async ({ browser }) => {
  model.members.add(A.id);
  const context = await browser.newContext(); await backend(context, A); const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Already have an account? Sign in' }).click();
  await authenticate(page, A, 'returning-a');
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible();
  await page.goto('/roots');
  await page.getByRole('button', { name: 'Invite my partner', exact: true }).click();
  await expect(page.getByLabel('Your first name')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible();
  expect(model.creations).toEqual([]);
  await context.close();
});

test('invalid and full invitations show understandable errors', async ({ browser }) => {
  const context = await browser.newContext(); await backend(context, B); const page = await context.newPage();
  await page.goto('/invite/' + '0'.repeat(64)); await expect(page.getByText('This invitation link is not valid.')).toBeVisible();
  model.name = 'Alex'; model.token = token; model.members.add(A.id); model.members.add(B.id);
  await page.goto('/invite/' + token, { waitUntil: 'domcontentloaded' }); await expect(page.getByText('This relationship already has two people.')).toBeVisible();
  await context.close();
});


