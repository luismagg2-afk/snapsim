import type { Contact, Settings, SpotlightItem } from './types';

const HOUR = 3600_000;

type Seed = Pick<Contact, 'name' | 'friendEmoji' | 'streak' | 'status' | 'timeLabel'> & Partial<Contact>;

// Order, statuses, times and streaks transcribed from the reference screenshot.
const SEEDS: Seed[] = [
  { name: 'Número Unoooo🫶🏽', friendEmoji: '💕', streak: 58, status: 'received_chat', timeLabel: '1h', pinned: true },
  { name: 'Noel🔥', friendEmoji: '😊', streak: 8, status: 'sent_snap_opened', timeLabel: '2h' },
  { name: 'Yarrrrak', friendEmoji: '😊', streak: 4, status: 'sent_snap_delivered', timeLabel: '1h' },
  { name: 'Ferdi', friendEmoji: '😊', streak: 5, status: 'sent_snap_delivered', timeLabel: '3h' },
  { name: '🌟', friendEmoji: '😊', streak: 18, status: 'sent_snap_delivered', timeLabel: '1h' },
  { name: 'Navid Ali', friendEmoji: '😊', streak: 4, status: 'sent_snap_delivered', timeLabel: '2h' },
  { name: 'Alex Lauterbach', friendEmoji: '😊', streak: 5, status: 'sent_snap_opened', timeLabel: '1h' },
  { name: 'Joel', friendEmoji: '😊', streak: 8, status: 'sent_snap_opened', timeLabel: '3h', nameBadge: 'star', storyRing: 'seen' },
  { name: 'Liam', friendEmoji: '😊', streak: 3, status: 'sent_snap_delivered', timeLabel: '1h' },
  { name: 'Luciaa (luis Schwesterr)', friendEmoji: '', streak: 0, status: 'sent_snap_delivered', timeLabel: '2h', showStreak: false },
];

export function defaultContacts(now = Date.now()): Contact[] {
  return SEEDS.map((_, i) => makeDefault(i, now)!);
}

export function makeDefault(index: number, now = Date.now()): Contact | null {
  const s = SEEDS[index];
  if (!s) return null;
  const hours = parseInt(s.timeLabel) || 1;
  return {
    id: `c${index + 1}`,
    defaultId: `c${index + 1}`,
    avatar: `avatars/c${index + 1}.png`,
    nameBadge: 'none',
    showStreak: true,
    hourglass: false,
    streakMode: 'manual',
    lastStreakBump: now - hours * HOUR,
    lastInteraction: now - hours * HOUR,
    timeMode: 'fixed',
    pinned: false,
    storyRing: 'none',
    autoReply: true,
    ...s,
  };
}

export function defaultIndexOf(defaultId?: string) {
  if (!defaultId) return -1;
  const n = parseInt(defaultId.slice(1));
  return Number.isFinite(n) ? n - 1 : -1;
}

export const DEFAULT_SETTINGS: Settings = {
  statusBarMode: 'auto',
  sbTime: '17:46',
  sbAutoTime: true,
  sbBattery: 38,
  sbSignal: 4,
  exportStatusBar: true,
  exportWatermark: true,
  autoReplies: true,
  addFriendBadge: 5,
  flashbacksBadge: 1,
  myAvatar: 'avatars/me.png',
  myName: 'Ich',
  viewMode: 'auto',
  webBanner: true,
  webBackground: '',
  mapTitle: 'Berlin',
  mapWeather: '7 °C',
  sbWifi: true,
  sbIsland: false,
  sbFocus: false,
  v: 2,
};

const GRADIENTS = [
  'linear-gradient(160deg,#ff6a88,#ff99ac 40%,#fcb69f)',
  'linear-gradient(160deg,#0f2027,#203a43,#2c5364)',
  'linear-gradient(160deg,#f7971e,#ffd200)',
  'linear-gradient(160deg,#654ea3,#eaafc8)',
  'linear-gradient(160deg,#11998e,#38ef7d)',
  'linear-gradient(160deg,#1e3c72,#2a5298)',
];

export function defaultSpotlight(now = Date.now()): SpotlightItem[] {
  const items: [string, string, string][] = [
    ['🌅', 'Sonnenuntergang am See', 'naturvibes'],
    ['🏙️', 'Nachtfahrt durch die Stadt', 'cityloops'],
    ['🍕', 'Beste Pizza der Stadt?', 'foodtour'],
    ['🐶', 'Er wollte nur spielen', 'dogsdaily'],
    ['⚽', 'Was für ein Tor!', 'kicktok'],
    ['🎧', 'Neuer Lieblingssong', 'beatsbox'],
  ];
  return items.map(([emoji, caption, author], i) => ({
    id: `sp${i}`,
    emoji,
    caption,
    author,
    gradient: GRADIENTS[i % GRADIENTS.length],
    likes: 1200 + i * 731,
    liked: false,
    createdAt: now - i * HOUR,
  }));
}

export const FRIEND_EMOJIS = ['', '😊', '💕', '❤️', '💛', '😎', '😬', '😏', '🔥', '💯', '🎂', '⭐', '🌟', '👶', '💀', '😁'];

export const CANNED_REPLIES = [
  'haha 😂',
  'Ja safe',
  'Was machst du gerade?',
  'Lol',
  '😂😂',
  'Bin gleich da',
  'Okay 👍',
  'Echt jetzt? 😳',
  'Schick mal Snap',
  'Gute Nacht 😴',
  'Wann treffen wir uns?',
  'Hahaha nein',
];
