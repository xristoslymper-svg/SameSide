import { spawn } from 'node:child_process';

const scenario = process.argv[2];
if (!['fresh','legacy','returning'].includes(scenario)) {
  console.error('Use: pnpm dev:scenario fresh|legacy|returning'); process.exit(1);
}
console.log(`LOCAL FIXTURE: ${scenario}. API requests are mocked; no production data is changed.
Close the test browser / stop this command and run again to reset the fixture.
Sign out only ends the fixture session. Refresh preserves the current fixture.
Fresh: use Start on my own, foundation-test@example.test and any test password.
The browser pauses for manual exploration. Close it when finished (do not Resume).
This exercises UI and session persistence, not real Supabase authentication/RLS.`);
const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js','test','--headed','--timeout=0','--grep',`scenario: ${scenario}`], {
  stdio:'inherit', env:{...process.env,SAMESIDE_MANUAL:'1'},
});
child.on('exit',code=>process.exit(code ?? 0));
