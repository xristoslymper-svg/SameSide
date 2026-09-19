import { test, expect } from '@playwright/test';

test('demo completes onboarding, pairs locally, uses product tabs and never contacts Supabase',async({page})=>{
 const remote:string[]=[];page.on('request',r=>{if(new URL(r.url()).hostname.endsWith('supabase.co'))remote.push(r.url());});
 await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('real-account-sentinel','preserve-me'));
 await page.getByRole('button',{name:'Explore demo — no sign-in'}).click();
 await expect(page.getByText('DEMO · Sample data only')).toBeVisible();
 await page.getByRole('button',{name:'Start together',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Choose The Routine'}).click();
 await page.getByRole('button',{name:'Choose your flower',exact:true}).click();
 await page.getByRole('button',{name:'Discover Cosmos',exact:true}).click();
 await page.getByRole('button',{name:'Choose Cosmos',exact:true}).click();
 await page.getByRole('button',{name:'Start the shift'}).click();
 await page.getByRole('button',{name:'Simulate partner joining'}).click();
 await expect(page.getByText("You're on the same side",{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page).toHaveURL(/\/today$/);
 await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('button',{name:'See what grew →'}).click();
 await expect(page.getByText('1 little moment has helped it grow.')).toBeVisible();
 await page.getByRole('tab',{name:/Roots/}).click();
 await page.getByRole('button',{name:'Fun',exact:true}).click();
 await page.getByRole('button',{name:'This feels right'}).click();
 await page.getByLabel('Your private thought').fill('This is only a demo thought.');
 await page.getByRole('button',{name:'Keep this thought'}).click();
 await page.reload();await expect(page.getByText('“This is only a demo thought.”')).toBeVisible();
 await page.getByRole('button',{name:'Demo controls'}).click();
 await page.getByRole('button',{name:'Restart demo from beginning'}).click();
 await expect(page.getByRole('button',{name:'Start together',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Demo controls'}).click();
 await page.getByRole('button',{name:'Exit demo — return to real app'}).click();
 await expect(page.getByText('DEMO · Sample data only')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('real-account-sentinel'))).toBe('preserve-me');
 expect(remote).toEqual([]);
});

test('demo scenarios use actual growth model; legacy choice, solo onboarding, and reset stay isolated',async({page})=>{
 const remote:string[]=[];page.on('request',r=>{if(new URL(r.url()).hostname.endsWith('supabase.co'))remote.push(r.url());});
 await page.goto('/?demo=1');
 for(const [name,stage] of [['Paired · Week 1','Tiny shoot'],['Week 3 · Established plant','Established plant'],['Week 4 · Full bloom','Full bloom']] as const) {
  await page.getByRole('button',{name:'Demo controls'}).click();await page.getByRole('button',{name,exact:true}).click();
  await expect(page.getByRole('img',{name:'Cosmos: '+stage,exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('img',{name:'Cosmos: '+stage,exact:true})).toBeVisible();
 }
 await page.getByRole('button',{name:'Demo controls'}).click();await page.getByRole('button',{name:'Choose a missing flower'}).click();
 await page.getByRole('button',{name:'Choose your flower',exact:true}).click();
 await page.getByRole('button',{name:'Discover Daisy',exact:true}).click();await page.getByRole('button',{name:'Choose Daisy',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('img',{name:'Daisy: Tiny shoot',exact:true})).toBeVisible();
 await expect(page.getByText('9 little moments have helped it grow.')).toBeVisible();
 await page.getByRole('button',{name:'Demo controls'}).click();await page.getByRole('button',{name:'Restart demo from beginning'}).click();
 await page.getByRole('button',{name:'Start on my own',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Choose The Routine'}).click();await page.getByRole('button',{name:'Choose your flower',exact:true}).click();
 await page.getByRole('button',{name:'Discover Cosmos',exact:true}).click();await page.getByRole('button',{name:'Choose Cosmos',exact:true}).click();
 await page.getByRole('button',{name:'Start the shift'}).click();await expect(page).toHaveURL(/\/today$/);
 await page.getByRole('button',{name:'Account',exact:true}).click();await expect(page.getByLabel('New test password')).toHaveCount(0);
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('button',{name:'Start together',exact:true})).toBeVisible();
 expect(remote).toEqual([]);
});

test('demo cannot activate on a non-local hostname, even with demo query parameter',async({page})=>{
 await page.route('http://sameside.example/**',async route=>{
  const response=await route.fetch({url:route.request().url().replace('http://sameside.example','http://localhost:8081')});
  await route.fulfill({response});
 });
 await page.goto('http://sameside.example/?demo=1');
 await expect(page.getByRole('button',{name:'Start together',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Explore demo — no sign-in'})).toHaveCount(0);
 await expect(page.getByText('DEMO · Sample data only')).toHaveCount(0);
});
