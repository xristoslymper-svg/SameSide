import { isDemo, demoStorage } from './demo';
// Metro selects storage.native.ts on iOS/Android; web uses persistent localStorage.
export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isDemo) return demoStorage.getItem(key);
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (isDemo) return demoStorage.setItem(key, value);
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (isDemo) return demoStorage.removeItem(key);
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};
