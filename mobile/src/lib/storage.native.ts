import * as SecureStore from 'expo-secure-store';

// Session JSON can exceed platform per-item limits. Commit a small manifest last.
// Each chunk contains at most 400 Unicode code points (at most 1600 UTF-8 bytes).
type Manifest = { generation: string; count: number };
async function manifest(key: string): Promise<Manifest | null> {
  const raw = await SecureStore.getItemAsync(key);
  return raw ? JSON.parse(raw) as Manifest : null;
}
const chunkKey = (key: string, m: Manifest, i: number) => `${key}.${m.generation}.${i}`;
async function clean(key: string, m: Manifest | null) {
  if (m) await Promise.all(Array.from({ length: m.count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, m, i))));
}
export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const m = await manifest(key);
    if (!m) return null;
    const chunks = await Promise.all(Array.from({ length: m.count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, m, i))));
    if (chunks.some(chunk => chunk === null)) throw new Error('Your saved sign-in could not be read. Please try again.');
    return chunks.join('');
  },
  async setItem(key: string, value: string) {
    const previous = await manifest(key);
    const chars = Array.from(value);
    const m = { generation: `${Date.now()}-${Math.random().toString(36).slice(2)}`, count: Math.ceil(chars.length / 400) };
    try {
      for (let i = 0; i < m.count; i++) await SecureStore.setItemAsync(chunkKey(key, m, i), chars.slice(i * 400, (i + 1) * 400).join(''));
      await SecureStore.setItemAsync(key, JSON.stringify(m));
    } catch (error) { await clean(key, m).catch(() => undefined); throw error; }
    await clean(key, previous).catch(() => undefined);
  },
  async removeItem(key: string) {
    const previous = await manifest(key);
    await SecureStore.deleteItemAsync(key);
    await clean(key, previous);
  },
};
