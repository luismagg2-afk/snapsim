import { create } from 'zustand';
import type { Backup, Contact, Message, Screen, Settings, SpotlightItem, Story } from './types';
import { CANNED_REPLIES, DEFAULT_SETTINGS, defaultContacts, defaultIndexOf, defaultSpotlight, makeDefault } from './defaults';
import { clearAll, loadAll, remove, requestPersistence, save } from './db';
import { dayKey, uid } from './utils';

export type Sheet = null | 'menu' | 'contacts' | 'statusbar' | 'backup' | 'about' | 'placeholder' | 'storyadmin';

interface State {
  ready: boolean;
  contacts: Contact[];
  messages: Record<string, Message[]>;
  stories: Story[];
  spotlight: SpotlightItem[];
  settings: Settings;

  screen: Screen;
  openChatId: string | null;
  snapView: { contactId: string; messageId: string } | null;
  storyView: { author: string } | null;
  sheet: Sheet;
  placeholder: { title: string; text: string } | null;
  editContactId: string | null;
  exporting: boolean;
  toast: string | null;
  typing: Record<string, boolean>;
  /** Snap image handed from the camera to the "send to" screen. */
  pendingSnap: string | null;
  /** Contact preselected as recipient when the camera was opened from a chat row. */
  cameraFor: string | null;

  init: () => Promise<void>;
  setScreen: (s: Screen) => void;
  openCamera: (contactId?: string) => void;
  openChat: (id: string | null) => void;
  setSheet: (s: Sheet) => void;
  showPlaceholder: (title: string, text: string) => void;
  setEditContact: (id: string | null) => void;
  setExporting: (v: boolean) => void;
  showToast: (t: string) => void;
  setPendingSnap: (img: string | null) => void;

  updateSettings: (p: Partial<Settings>) => void;
  updateContact: (id: string, p: Partial<Contact>) => void;
  addContact: () => string;
  removeContact: (id: string) => void;
  moveContact: (from: number, to: number) => void;
  resetContact: (id: string) => void;
  restoreDefaults: () => void;

  sendMessage: (contactId: string, m: { text?: string; image?: string }) => void;
  receiveMessage: (contactId: string, m: { text?: string; image?: string }) => void;
  deleteMessage: (contactId: string, messageId: string) => void;
  toggleSaved: (contactId: string, messageId: string) => void;
  sendSnap: (image: string, contactIds: string[], toStory: boolean) => void;
  receiveSnap: (contactId: string, image: string) => void;
  openSnap: (contactId: string) => boolean;
  closeSnap: () => void;

  addStory: (author: string, image: string) => void;
  deleteStory: (id: string) => void;
  openStories: (author: string | null) => void;
  markStoriesViewed: (author: string) => void;

  addSpotlight: (image: string, caption: string) => void;
  toggleLike: (id: string) => void;
  removeSpotlight: (id: string) => void;

  exportBackup: () => Backup;
  importBackup: (b: Backup) => Promise<void>;
  resetAll: () => Promise<void>;
}

/** Fills in new settings; v2 switched the status bar to the live clock. */
function migrateSettings(s?: Partial<Settings>): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...s };
  if ((s?.v ?? 1) < 2) merged.sbAutoTime = true;
  merged.v = DEFAULT_SETTINGS.v;
  return merged;
}

const timers = new Set<ReturnType<typeof setTimeout>>();
const later = (ms: number, fn: () => void) => {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
};

export const useStore = create<State>((set, get) => {
  const patchContact = (id: string, p: Partial<Contact> | ((c: Contact) => Partial<Contact>)) =>
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...(typeof p === 'function' ? p(c) : p) } : c)),
    }));

  const pushMessage = (contactId: string, m: Message) =>
    set((s) => ({ messages: { ...s.messages, [contactId]: [...(s.messages[contactId] ?? []), m] } }));

  const patchMessages = (contactId: string, fn: (m: Message) => Message) =>
    set((s) => ({ messages: { ...s.messages, [contactId]: (s.messages[contactId] ?? []).map(fn) } }));

  /** Simulated friend behaviour: open what you sent, maybe type a reply. Purely local. */
  const simulateFriend = (contactId: string, kind: 'chat' | 'snap') => {
    const c = get().contacts.find((x) => x.id === contactId);
    if (!c || !get().settings.autoReplies || !c.autoReply) return;
    later(1500 + Math.random() * 1500, () => {
      patchMessages(contactId, (m) => (m.from === 'me' ? { ...m, status: 'opened' } : m));
      patchContact(contactId, (cc) =>
        cc.status === 'sent_chat_delivered'
          ? { status: 'sent_chat_opened' }
          : cc.status === 'sent_snap_delivered'
            ? { status: 'sent_snap_opened' }
            : {},
      );
      if (kind !== 'chat') return;
      later(800, () => {
        set((s) => ({ typing: { ...s.typing, [contactId]: true } }));
        later(1500 + Math.random() * 2000, () => {
          set((s) => ({ typing: { ...s.typing, [contactId]: false } }));
          get().receiveMessage(contactId, { text: CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)] });
        });
      });
    });
  };

  const bumpStreak = (c: Contact, now: number): Partial<Contact> => {
    if (c.streakMode !== 'daily' || dayKey(c.lastStreakBump) === dayKey(now)) return {};
    return { streak: c.streak + 1, lastStreakBump: now, showStreak: true, hourglass: false };
  };

  return {
    ready: false,
    contacts: [],
    messages: {},
    stories: [],
    spotlight: [],
    settings: DEFAULT_SETTINGS,
    screen: 'chat',
    openChatId: null,
    snapView: null,
    storyView: null,
    sheet: null,
    placeholder: null,
    editContactId: null,
    exporting: false,
    toast: null,
    typing: {},
    pendingSnap: null,
    cameraFor: null,

    init: async () => {
      try {
        const p = await loadAll();
        set({
          contacts: p.contacts ?? defaultContacts(),
          messages: p.messages,
          stories: p.stories ?? [],
          spotlight: p.spotlight ?? defaultSpotlight(),
          settings: migrateSettings(p.settings),
          ready: true,
        });
      } catch (e) {
        console.error('IndexedDB unavailable, running without persistence', e);
        set({ contacts: defaultContacts(), spotlight: defaultSpotlight(), ready: true });
        get().showToast('Speicher nicht verfügbar – Änderungen werden nicht gesichert.');
      }
      requestPersistence();
    },

    setScreen: (screen) => set({ screen, openChatId: null, cameraFor: null }),
    openCamera: (contactId) => set({ screen: 'camera', openChatId: null, cameraFor: contactId ?? null }),
    openChat: (id) => {
      if (id) {
        patchContact(id, (c) =>
          c.status === 'new_chat' ? { status: 'received_chat' } : {},
        );
      }
      set({ openChatId: id });
    },
    setSheet: (sheet) => set({ sheet }),
    showPlaceholder: (title, text) => set({ placeholder: { title, text }, sheet: 'placeholder' }),
    setEditContact: (editContactId) => set({ editContactId }),
    setExporting: (exporting) => set({ exporting }),
    showToast: (toast) => {
      set({ toast });
      later(2600, () => get().toast === toast && set({ toast: null }));
    },
    setPendingSnap: (pendingSnap) => set({ pendingSnap }),

    updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
    updateContact: (id, p) => patchContact(id, p),
    addContact: () => {
      const id = uid();
      const now = Date.now();
      const c: Contact = {
        id,
        name: 'Neuer Kontakt',
        avatar: '',
        friendEmoji: '😊',
        nameBadge: 'none',
        streak: 0,
        showStreak: false,
        hourglass: false,
        streakMode: 'manual',
        lastStreakBump: now,
        lastInteraction: now,
        status: 'tap_to_chat',
        timeLabel: '',
        timeMode: 'fixed',
        pinned: false,
        storyRing: 'none',
        autoReply: true,
      };
      set((s) => ({ contacts: [...s.contacts, c] }));
      return id;
    },
    removeContact: (id) => {
      set((s) => {
        const messages = { ...s.messages };
        delete messages[id];
        return { contacts: s.contacts.filter((c) => c.id !== id), messages, stories: s.stories.filter((x) => x.author !== id) };
      });
      remove(`msgs:${id}`);
    },
    moveContact: (from, to) =>
      set((s) => {
        const list = [...s.contacts];
        const [item] = list.splice(from, 1);
        list.splice(Math.max(0, Math.min(list.length, to)), 0, item);
        return { contacts: list };
      }),
    resetContact: (id) => {
      const c = get().contacts.find((x) => x.id === id);
      const idx = defaultIndexOf(c?.defaultId);
      const def = idx >= 0 ? makeDefault(idx) : null;
      if (def) patchContact(id, { ...def, id });
      else patchContact(id, { streak: 0, showStreak: false, hourglass: false, status: 'tap_to_chat', timeLabel: '', timeMode: 'fixed' });
    },
    restoreDefaults: () => {
      const ids = new Set(get().contacts.map((c) => c.id));
      ids.forEach((id) => remove(`msgs:${id}`));
      set({ contacts: defaultContacts(), messages: {}, stories: [] });
    },

    sendMessage: (contactId, { text, image }) => {
      const now = Date.now();
      pushMessage(contactId, {
        id: uid(),
        contactId,
        from: 'me',
        type: image ? 'image' : 'text',
        text,
        image,
        createdAt: now,
        status: 'delivered',
        saved: false,
      });
      patchContact(contactId, { status: 'sent_chat_delivered', lastInteraction: now, timeMode: 'auto' });
      simulateFriend(contactId, 'chat');
    },
    receiveMessage: (contactId, { text, image }) => {
      const now = Date.now();
      pushMessage(contactId, {
        id: uid(),
        contactId,
        from: 'them',
        type: image ? 'image' : 'text',
        text,
        image,
        createdAt: now,
        status: 'opened',
        saved: false,
      });
      const open = get().openChatId === contactId;
      patchContact(contactId, { status: open ? 'received_chat' : 'new_chat', lastInteraction: now, timeMode: 'auto' });
    },
    deleteMessage: (contactId, messageId) =>
      set((s) => ({ messages: { ...s.messages, [contactId]: (s.messages[contactId] ?? []).filter((m) => m.id !== messageId) } })),
    toggleSaved: (contactId, messageId) => patchMessages(contactId, (m) => (m.id === messageId ? { ...m, saved: !m.saved } : m)),

    sendSnap: (image, contactIds, toStory) => {
      const now = Date.now();
      for (const id of contactIds) {
        pushMessage(id, { id: uid(), contactId: id, from: 'me', type: 'snap', image, createdAt: now, status: 'delivered', saved: false });
        patchContact(id, (c) => ({ status: 'sent_snap_delivered', lastInteraction: now, timeMode: 'auto', ...bumpStreak(c, now) }));
        simulateFriend(id, 'snap');
      }
      if (toStory) get().addStory('me', image);
    },
    receiveSnap: (contactId, image) => {
      const now = Date.now();
      pushMessage(contactId, { id: uid(), contactId, from: 'them', type: 'snap', image, createdAt: now, status: 'delivered', saved: false });
      patchContact(contactId, { status: 'new_snap', lastInteraction: now, timeMode: 'auto' });
    },
    openSnap: (contactId) => {
      const m = (get().messages[contactId] ?? []).find((x) => x.from === 'them' && x.type === 'snap' && x.status === 'delivered');
      if (!m) return false;
      set({ snapView: { contactId, messageId: m.id } });
      return true;
    },
    closeSnap: () => {
      const v = get().snapView;
      if (!v) return;
      patchMessages(v.contactId, (m) => (m.id === v.messageId ? { ...m, status: 'opened' } : m));
      const more = (get().messages[v.contactId] ?? []).some((x) => x.from === 'them' && x.type === 'snap' && x.status === 'delivered');
      if (!more) patchContact(v.contactId, (c) => (c.status === 'new_snap' ? { status: 'received_snap' } : {}));
      set({ snapView: null });
    },

    addStory: (author, image) =>
      set((s) => ({ stories: [...s.stories, { id: uid(), author, image, createdAt: Date.now(), viewed: author === 'me' }] })),
    deleteStory: (id) => set((s) => ({ stories: s.stories.filter((x) => x.id !== id) })),
    openStories: (author) => set({ storyView: author ? { author } : null }),
    markStoriesViewed: (author) =>
      set((s) => ({
        stories: s.stories.map((x) => (x.author === author ? { ...x, viewed: true } : x)),
        contacts: s.contacts.map((c) => (c.id === author && c.storyRing === 'unseen' ? { ...c, storyRing: 'seen' } : c)),
      })),

    addSpotlight: (image, caption) =>
      set((s) => ({
        spotlight: [
          { id: uid(), image, caption, author: 'du', likes: 0, liked: false, createdAt: Date.now() },
          ...s.spotlight,
        ],
      })),
    removeSpotlight: (id) => set((s) => ({ spotlight: s.spotlight.filter((x) => x.id !== id) })),
    toggleLike: (id) =>
      set((s) => ({
        spotlight: s.spotlight.map((x) => (x.id === id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)),
      })),

    exportBackup: () => {
      const s = get();
      return {
        app: 'snapsim',
        version: 1,
        exportedAt: new Date().toISOString(),
        contacts: s.contacts,
        messages: s.messages,
        stories: s.stories,
        spotlight: s.spotlight,
        settings: s.settings,
      };
    },
    importBackup: async (b) => {
      if (b?.app !== 'snapsim' || !Array.isArray(b.contacts)) throw new Error('Keine gültige SnapSim-Sicherung');
      timers.forEach(clearTimeout);
      timers.clear();
      await clearAll();
      set({
        contacts: b.contacts,
        messages: b.messages ?? {},
        stories: b.stories ?? [],
        spotlight: b.spotlight ?? defaultSpotlight(),
        settings: migrateSettings(b.settings),
        openChatId: null,
        typing: {},
      });
    },
    resetAll: async () => {
      timers.forEach(clearTimeout);
      timers.clear();
      await clearAll();
      set({
        contacts: defaultContacts(),
        messages: {},
        stories: [],
        spotlight: defaultSpotlight(),
        settings: DEFAULT_SETTINGS,
        openChatId: null,
        typing: {},
        screen: 'chat',
      });
    },
  };
});

/** Writes changed slices to IndexedDB (debounced). */
export function startPersistence() {
  let prev = useStore.getState();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const dirty = new Set<string>();

  const flush = async () => {
    timer = null;
    const s = useStore.getState();
    const jobs: Promise<unknown>[] = [];
    for (const key of dirty) {
      if (key === 'contacts') jobs.push(save('contacts', s.contacts));
      else if (key === 'stories') jobs.push(save('stories', s.stories));
      else if (key === 'spotlight') jobs.push(save('spotlight', s.spotlight));
      else if (key === 'settings') jobs.push(save('settings', s.settings));
      else if (key.startsWith('msgs:')) jobs.push(save(key, s.messages[key.slice(5)] ?? []));
    }
    dirty.clear();
    try {
      await Promise.all(jobs);
    } catch (e) {
      console.error(e);
      const quota = (e as Error)?.name === 'QuotaExceededError';
      s.showToast(quota ? 'Speicher voll – lösche alte Snaps oder exportiere ein Backup.' : 'Speichern fehlgeschlagen.');
    }
  };

  // Make sure pending writes land before iOS suspends the page.
  const flushNow = () => {
    if (timer) {
      clearTimeout(timer);
      flush();
    }
  };
  document.addEventListener('visibilitychange', () => document.hidden && flushNow());
  window.addEventListener('pagehide', flushNow);

  return useStore.subscribe((s) => {
    if (!s.ready) {
      prev = s;
      return;
    }
    if (s.contacts !== prev.contacts) dirty.add('contacts');
    if (s.stories !== prev.stories) dirty.add('stories');
    if (s.spotlight !== prev.spotlight) dirty.add('spotlight');
    if (s.settings !== prev.settings) dirty.add('settings');
    if (s.messages !== prev.messages) {
      for (const id of Object.keys(s.messages)) if (s.messages[id] !== prev.messages[id]) dirty.add(`msgs:${id}`);
    }
    prev = s;
    if (dirty.size && !timer) timer = setTimeout(flush, 250);
  });
}
