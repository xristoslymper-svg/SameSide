import { useState } from 'react';
import { router } from 'expo-router';
import { Button, Notice } from './ui';
import { useAuth } from '../providers/AuthProvider';

// Once setup has created a relationship, exiting must not undo that relationship.
export function SetupExit() {
 const { signOut } = useAuth();
 const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
 async function exit() {
  if (busy) return; setBusy(true); setError(null);
  try { await signOut(); router.replace('/'); }
  catch { setError('We couldn’t sign you out. Please try again.'); }
  finally { setBusy(false); }
 }
 return <>{error && <Notice>{error}</Notice>}<Button label="Sign out and return to opening" secondary busy={busy} onPress={() => { void exit(); }}/></>;
}
