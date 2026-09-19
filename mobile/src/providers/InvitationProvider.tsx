import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { sessionStorage } from '../lib/storage';
import { Loading } from '../components/ui';

const key = 'same-side.pending-invite.v1';
type PendingInvitation = { token: string; name: string | null };
type Value = { token: string | null; name: string | null; setInvitation: (token: string, name: string | null) => Promise<void>; clearToken: () => Promise<void> };
const Context = createContext<Value | null>(null);

function parse(value: string | null): PendingInvitation | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed?.token === 'string') return { token: parsed.token, name: typeof parsed.name === 'string' ? parsed.name : null };
  } catch {}
  // Previous builds stored only the raw token.
  if (/^[a-f0-9]{64}$/i.test(value)) return { token: value, name: null };
  return null;
}

export function InvitationProvider({ children }: PropsWithChildren) {
  const [loaded, setLoaded] = useState(false);
  const [invitation, setCurrent] = useState<PendingInvitation | null>(null);
  useEffect(() => { let active = true; void sessionStorage.getItem(key).then(value => { if (active) setCurrent(parse(value)); }).finally(() => { if (active) setLoaded(true); }); return () => { active = false; }; }, []);
  async function setInvitation(token: string, name: string | null) {
    const value = { token, name };
    await sessionStorage.setItem(key, JSON.stringify(value));
    setCurrent(value);
  }
  async function clearToken() { await sessionStorage.removeItem(key); setCurrent(null); }
  if (!loaded) return <Loading/>;
  return <Context.Provider value={{ token: invitation?.token ?? null, name: invitation?.name ?? null, setInvitation, clearToken }}>{children}</Context.Provider>;
}
export function useInvitation() {
  const value = useContext(Context);
  if (!value) throw new Error('InvitationProvider is missing');
  return value;
}
