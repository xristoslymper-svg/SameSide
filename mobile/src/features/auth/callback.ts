export function parseAuthCallback(url: string): { code?: string; error?: string } | null {
  const parsed = new URL(url);
  // Native scheme is sameside://auth/callback; web is https://host/auth/callback.
  const path = parsed.protocol === 'sameside:' ? `/${parsed.host}${parsed.pathname}` : parsed.pathname;
  if (path !== '/auth/callback') return null;
  const hash = new URLSearchParams(parsed.hash.slice(1));
  const error = parsed.searchParams.get('error_description') ?? hash.get('error_description');
  if (error) return { error: 'This sign-in link is no longer available. Please request a new one.' };
  const code = parsed.searchParams.get('code');
  if (code) return { code };
  return { error: 'This sign-in link could not be opened. Please request a new one in this browser or app.' };
}
