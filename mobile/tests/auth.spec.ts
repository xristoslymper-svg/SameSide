import { test, expect, type BrowserContext } from '@playwright/test';

// Real Supabase client, mocked HTTP boundary: no emails or production writes.
const email = 'foundation-test@example.test';
const userId = '11111111-1111-4111-8111-111111111111';
const memberships = new Set<string>();
const flowerChoices = new Map<string,string>();
test.beforeEach(() => { memberships.clear(); flowerChoices.clear(); });
function fakeSession(id = userId) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return {
    access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: expires, aud: 'authenticated', role: 'authenticated' })}.test-only-signature`,
    refresh_token: 'test-only-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: expires,
    user: { id, aud: 'authenticated', role: 'authenticated', email, created_at: new Date().toISOString(), app_metadata: {}, user_metadata: {} },
  };
}
async function mockAuth(context: BrowserContext, requests: string[], id = userId) {
  await context.route('**/auth/v1/**', async route => {
    const req = route.request();
    const url = new URL(req.url()); requests.push(url.pathname);
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname.endsWith('/otp')) {
      const body = req.postDataJSON(); expect(body.email).toBe(email); expect(body.code_challenge).toBeTruthy();
      expect(url.searchParams.get('redirect_to')).toBe('http://localhost:8081/auth/callback');
      return route.fulfill({ status: 200, json: {}, headers });
    }
    if (url.pathname.endsWith('/token')) {
      const body = req.postDataJSON();
      if (url.searchParams.get('grant_type') === 'password') expect(body.password).toBeTruthy();
      else expect(body.code_verifier).toBeTruthy();
      return route.fulfill({ status: 200, json: fakeSession(id), headers });
    }
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, headers });
    if (url.pathname.endsWith('/user')) {
      if (req.method() === 'PUT') { expect(req.postDataJSON().password).toBeTruthy(); return route.fulfill({ status: 200, json: { user: fakeSession(id).user }, headers }); }
      return route.fulfill({ status: 200, json: fakeSession(id).user, headers });
    }
    throw new Error(`Unexpected auth request: ${url.pathname}`);
  });
  await context.route('**/rest/v1/**', async route => {
    const req = route.request(); const url = new URL(req.url());
    const headers = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'Content-Range', 'content-type': 'application/json' };
    if (url.pathname.endsWith('/rpc/create_solo_relationship')) { memberships.add(id); return route.fulfill({ status: 200, body: JSON.stringify('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), headers }); }
    if (url.pathname.endsWith('/relationship_members') && req.method() === 'HEAD') return route.fulfill({ status: 200, headers: { ...headers, 'content-range': '0-0/1' } });
    if (url.pathname.endsWith('/relationship_members') && req.method() === 'GET') return route.fulfill({ status: 200, json: memberships.has(id) ? [{ relationship_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', member_role: 'member_a' }] : [], headers });
    if (url.pathname.endsWith('/rpc/choose_shared_flower')) { flowerChoices.set(id, req.postDataJSON().flower); return route.fulfill({status:200,json:flowerChoices.get(id),headers}); }
    if (url.pathname.endsWith('/rpc/get_shared_garden')) return route.fulfill({status:200,json:[],headers});
    if (url.pathname.endsWith('/rpc/get_my_daily_reflection')) return route.fulfill({status:200,json:{date:'2026-09-18',text:null},headers});
    if (url.pathname.endsWith('/rpc/get_my_root_preferences')) return route.fulfill({ status: 200, json: { choices: [], can_edit: true }, headers });
    if (url.pathname.endsWith('/relationships')) return route.fulfill({ status: 200, json: { active_path: 'routine', selected_flower: flowerChoices.get(id) ?? null, path_started_at: new Date().toISOString().slice(0,10), timezone:'UTC' }, headers });
    if (url.pathname.endsWith('/rpc/get_or_create_today_assignment')) return route.fulfill({ status: 200, json: { id: 'move', task_title: 'A kind note', task_body: 'Leave a kind note.', task_minutes: 2, program_day: 1, status: 'assigned' }, headers });
    throw new Error(`Unexpected product request: ${req.method()} ${url.pathname}`);
  });
}

test('local password sign-in uses a real Supabase password session request', async ({ page, context }) => {
  const requests: string[] = [];
  await mockAuth(context, requests);
  await page.goto('/');
  await page.getByRole('button', { name: 'Already have an account? Sign in' }).click();
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Test password', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Test sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Choose The Routine' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose The Routine' }).click();
  await page.getByRole('button', { name: 'Choose your flower', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Discover / })).toHaveCount(6);
  await expect.poll(() => page.locator('img').evaluateAll(images => images.length > 0 && images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({path:'test-results/flower-choices.png',fullPage:true});
  await page.getByRole('button', { name: 'Discover Cosmos', exact: true }).click();
  await page.getByRole('button', { name: 'Choose Cosmos', exact: true }).click();
  await expect(page.getByText('You chose Cosmos', {exact:true})).toBeVisible();
  await page.getByRole('button', { name: 'Start the shift' }).click();
  await page.goto('/roots');
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByLabel('New test password', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Save test password', exact: true }).click();
  await expect(page.getByText('Test password saved.')).toBeVisible();
  expect(requests.some(value => value.endsWith('/token'))).toBeTruthy();
});


for (const [label, intent] of [['Start together', 'together'], ['Start on my own', 'solo']] as const) {
  test(intent + ': onboarding survives email round trip, restart, completion and sign-out', async ({ browser }) => {
    const requests: string[] = [];
    let context = await browser.newContext(); await mockAuth(context, requests);
    let page = await context.newPage(); await page.goto('http://localhost:8081');
    await expect(page.getByText('A pattern breaks', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Email address', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByText('One action per day', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('radio', { name: label })).toBeChecked();
    await page.reload(); await expect(page.getByRole('radio', { name: label })).toBeChecked();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
    await expect(page.getByText('Check your email', { exact: true })).toBeVisible();
    const pending = await context.storageState(); await context.close();
    context = await browser.newContext({ storageState: pending }); await mockAuth(context, requests);
    page = await context.newPage(); await page.goto('http://localhost:8081/auth/callback?code=test-only-code');
    await expect(page.getByRole('button', { name: 'Choose The Routine' })).toBeVisible();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('same-side.onboarding.v1.11111111-1111-4111-8111-111111111111')!));
    expect(state.intent).toBe(intent);
    expect(await page.evaluate(() => localStorage.getItem('same-side.onboarding.v1.draft'))).toBeNull();
    await page.getByRole('button', { name: 'Choose The Routine' }).click();
    await page.getByRole('radio', { name: 'More playfulness' }).click();
    await expect(page.getByRole('radio', { name: 'More playfulness' })).toBeChecked();
    const incomplete = await context.storageState(); await context.close();
    context = await browser.newContext({ storageState: incomplete }); await mockAuth(context, requests);
    page = await context.newPage(); await page.goto('http://localhost:8081');
    await expect(page).toHaveURL(/\/personalize$/);
    await expect(page.getByRole('radio', { name: 'More playfulness' })).toBeChecked();
    await page.getByRole('button', { name: 'Back to your path' }).click();
    await page.getByRole('button', { name: 'Choose The Routine' }).click();
    await expect(page.getByRole('radio', { name: 'More playfulness' })).toBeChecked();
    await page.getByRole('button', { name: 'Choose your flower', exact: true }).click();
  await page.getByRole('button', { name: 'Discover Cosmos', exact: true }).click();
  await page.getByRole('button', { name: 'Choose Cosmos', exact: true }).click();
  await expect(page.getByText('You chose Cosmos', {exact:true})).toBeVisible();
  await page.getByRole('button', { name: 'Start the shift' }).click();
    if (intent === 'together') {
      await expect(page.getByText('Invite your partner', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Continue without inviting' }).click();
    }
    await expect(page.getByText('Today', { exact: true }).first()).toBeVisible();
    await page.reload(); await expect(page.getByText('Today', { exact: true }).first()).toBeVisible();
    await page.goto('/roots');
  await page.getByRole('button', { name: 'Account', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Start together', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Already have an account? Sign in' }).click();
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
    await expect(page.getByText('Check your email', { exact: true })).toBeVisible();
    await page.goto('http://localhost:8081/auth/callback?code=another-test-code');
    await expect(page.getByText('Today', { exact: true }).first()).toBeVisible();
    expect(requests.filter(value => value.endsWith('/otp'))).toHaveLength(2);
    expect(requests.filter(value => value.endsWith('/token'))).toHaveLength(2);
    await context.close();
  });
}

test('another account does not inherit private choices; personalization is optional', async ({ page, context }) => {
  const otherId = '22222222-2222-4222-8222-222222222222';
  await mockAuth(context, [], otherId);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('same-side.onboarding.v1.11111111-1111-4111-8111-111111111111', JSON.stringify({ version: 1, step: 'done', intent: 'together', path: 'routine', focus: 'attention' })));
  await page.getByRole('button', { name: 'Already have an account? Sign in' }).click();
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await expect(page.getByText('Check your email', { exact: true })).toBeVisible();
  await page.goto('/auth/callback?code=other-account');
  await page.getByRole('button', { name: 'Choose The Routine' }).click();
  await expect(page.getByRole('radio', { name: 'More attention' })).not.toBeChecked();
  await page.getByRole('button', { name: 'Choose your flower', exact: true }).click();
  await page.getByRole('button', { name: 'Discover Cosmos', exact: true }).click();
  await page.getByRole('button', { name: 'Choose Cosmos', exact: true }).click();
  await expect(page.getByText('You chose Cosmos', {exact:true})).toBeVisible();
  await page.getByRole('button', { name: 'Start the shift' }).click();
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible();
  const other = await page.evaluate(() => JSON.parse(localStorage.getItem('same-side.onboarding.v1.22222222-2222-4222-8222-222222222222')!));
  expect(other.intent).toBeNull(); expect(other.focus).toBeNull();
});

test('protected routes, expired links and changed starting intent', async ({ page, context }) => {
  await mockAuth(context, []);
  await page.goto('/welcome');
  await expect(page.getByRole('button', { name: 'Start together', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start together', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: 'Start on my own' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.goto('/auth/callback#error=access_denied&error_description=expired');
  await expect(page.getByText('This sign-in link is no longer available. Please request a new one.')).toBeVisible();
  await page.getByRole('button', { name: 'Back to sign in' }).click();
  await expect(page.getByRole('button', { name: 'Email me a sign-in link' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to starting mode' }).click();
  await expect(page.getByRole('radio', { name: 'Start on my own' })).toBeChecked();
});

test('storage failure does not silently advance onboarding', async ({ page, context }) => {
  await mockAuth(context, []); await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start together', exact: true })).toBeVisible();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); }; });
  await page.getByRole('button', { name: 'Start together', exact: true }).click();
  await expect(page.getByText('We could not save your place. Please try again before continuing.')).toBeVisible();
  await expect(page.getByText('One action per day', { exact: true })).toHaveCount(0);
});

test('opening and introduction fit a narrow viewport without runtime errors', async ({ page, context }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await mockAuth(context, []); await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start together', exact: true })).toBeVisible();
  await expect(page.getByText('Daily gestures of care, gratitude and attention that bring you closer again', {exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/opening-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Start together', exact: true }).click();
  await expect(page.getByText('One action per day', {exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/how-it-works-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});



test('scenario: fresh onboarding reaches the app; selected flower overrides stale onboarding on restart', async ({ context, page }) => {
  await mockAuth(context, []); await page.setViewportSize({width:390,height:844}); await page.goto('/');
  if (process.env.SAMESIDE_MANUAL === '1') await page.pause();
  await page.getByRole('button',{name:'Start on my own',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill(email);
  await page.getByLabel('Test password',{exact:true}).fill('local-test-password');
  await page.getByRole('button',{name:'Test sign in',exact:true}).click();
  await page.getByRole('button',{name:'Choose The Routine',exact:true}).click();
  await page.getByRole('button',{name:'Choose your flower',exact:true}).click();
  await page.getByRole('button',{name:'Discover Cosmos',exact:true}).click();
  await page.getByRole('button',{name:'Choose Cosmos',exact:true}).click();
  await page.getByRole('button',{name:'Start the shift',exact:true}).click();
  await expect(page).toHaveURL(/\/today$/);
  await page.evaluate(id => localStorage.setItem('same-side.onboarding.v1.'+id,JSON.stringify({version:1,step:'flower',intent:'solo',path:'routine',focus:null})),userId);
  await page.reload(); await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByText('A kind note',{exact:true})).toBeVisible();
});

// Manual fixtures are isolated from every remote service, including newly added APIs.
test.beforeEach(async ({ context }) => {
  if (process.env.SAMESIDE_MANUAL !== '1') return;
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === 'http://localhost:8081' ? route.continue() : route.abort();
  });
});

test('onboarding has state-aware back paths and can pause after relationship creation', async ({context,page}) => {
 await mockAuth(context,[]); await page.goto('/');
 await page.getByRole('button',{name:'Start on my own',exact:true}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page).toHaveURL(/:8081\/$/);
 await page.getByRole('button',{name:'Start on my own',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page).toHaveURL(/how-it-works$/);
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Back to starting mode',exact:true}).click();
 await expect(page).toHaveURL(/starting-mode$/);
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 const signIn=async()=>{
  await page.getByLabel('Email address',{exact:true}).fill(email);
  await page.getByLabel('Test password',{exact:true}).fill('local-test-password');
  await page.getByRole('button',{name:'Test sign in',exact:true}).click();
 };
 await signIn();
 await page.getByRole('button',{name:'Sign out and return to opening'}).click();
 await expect(page.getByRole('button',{name:'Start together',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Already have an account? Sign in'}).click(); await signIn();
 await page.getByRole('button',{name:'Choose The Routine'}).click();
 await page.getByRole('button',{name:'Back to your path'}).click();
 await page.getByRole('button',{name:'Choose The Routine'}).click();
 await page.getByRole('button',{name:'Choose your flower',exact:true}).click();
 await page.getByRole('button',{name:'Discover Cosmos',exact:true}).click();
 await page.getByRole('button',{name:'Close flower details'}).click();
 await page.getByRole('button',{name:'Sign out and return to opening'}).click();
 await expect(page.getByRole('button',{name:'Start together',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Already have an account? Sign in'}).click(); await signIn();
 await expect(page.getByRole('button',{name:/^Discover /})).toHaveCount(6);
 expect(memberships.size).toBe(1);
});
