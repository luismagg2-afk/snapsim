import { get, set, del, keys, createStore } from 'idb-keyval';
import type { Contact, Message, Settings, SpotlightItem, Story } from './types';

const store = createStore('snapsim', 'kv');

export interface Persisted {
  contacts?: Contact[];
  messages: Record<string, Message[]>;
  stories?: Story[];
  spotlight?: SpotlightItem[];
  settings?: Partial<Settings>;
}

export async function loadAll(): Promise<Persisted> {
  const [contacts, stories, spotlight, settings, allKeys] = await Promise.all([
    get<Contact[]>('contacts', store),
    get<Story[]>('stories', store),
    get<SpotlightItem[]>('spotlight', store),
    get<Partial<Settings>>('settings', store),
    keys(store),
  ]);
  const messages: Record<string, Message[]> = {};
  await Promise.all(
    allKeys
      .filter((k): k is string => typeof k === 'string' && k.startsWith('msgs:'))
      .map(async (k) => {
        const list = await get<Message[]>(k, store);
        if (list) messages[k.slice(5)] = list;
      }),
  );
  return { contacts, stories, spotlight, settings, messages };
}

export const save = (key: string, value: unknown) => set(key, value, store);
export const remove = (key: string) => del(key, store);

export async function clearAll() {
  const all = await keys(store);
  await Promise.all(all.map((k) => del(k, store)));
}

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}

export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported */
  }
}
