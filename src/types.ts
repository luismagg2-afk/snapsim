export type StatusKind =
  | 'sent_snap_delivered'
  | 'sent_snap_opened'
  | 'sent_chat_delivered'
  | 'sent_chat_opened'
  | 'sent_video_delivered'
  | 'sent_video_opened'
  | 'new_snap'
  | 'new_chat'
  | 'new_video'
  | 'received_snap'
  | 'received_chat'
  | 'received_video'
  | 'tap_to_chat';

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  friendEmoji: string;
  nameBadge: 'none' | 'star';
  streak: number;
  showStreak: boolean;
  hourglass: boolean;
  /** manual: never changes on its own. daily: +1 on the first snap you send per calendar day. */
  streakMode: 'manual' | 'daily';
  lastStreakBump: number;
  lastInteraction: number;
  status: StatusKind;
  timeLabel: string;
  /** fixed: show timeLabel verbatim. auto: compute from lastInteraction. */
  timeMode: 'fixed' | 'auto';
  pinned: boolean;
  storyRing: 'none' | 'unseen' | 'seen';
  autoReply: boolean;
  /** id of the default contact this one was created from (for "reset contact"). */
  defaultId?: string;
}

export interface Message {
  id: string;
  contactId: string;
  from: 'me' | 'them';
  type: 'text' | 'image' | 'snap';
  text?: string;
  image?: string;
  createdAt: number;
  status: 'delivered' | 'opened';
  saved: boolean;
}

export interface Story {
  id: string;
  author: string; // 'me' or contact id
  image: string;
  createdAt: number;
  viewed: boolean;
}

export interface SpotlightItem {
  id: string;
  image?: string;
  gradient?: string;
  emoji?: string;
  caption: string;
  author: string;
  likes: number;
  liked: boolean;
  createdAt: number;
}

export interface Settings {
  statusBarMode: 'auto' | 'always' | 'never';
  sbTime: string;
  sbAutoTime: boolean;
  sbBattery: number;
  sbSignal: number;
  exportStatusBar: boolean;
  exportWatermark: boolean;
  autoReplies: boolean;
  addFriendBadge: number;
  flashbacksBadge: number;
  myAvatar: string;
  myName: string;
  /** phone: iPhone app look. web: Snapchat-Web desktop look. auto: web on wide screens. */
  viewMode: 'phone' | 'web' | 'auto';
  webBanner: boolean;
  /** Background image (data URL) of the web view's right panel; empty = built-in gradient. */
  webBackground: string;
  /** Map tab: place name and weather shown at the top (purely decorative, no real location). */
  mapTitle: string;
  mapWeather: string;
  /** Wi-Fi symbol in the simulated status bar */
  sbWifi: boolean;
  /** Dynamic Island (real iOS screenshots don't show it; screen recordings do) */
  sbIsland: boolean;
  /** person icon after the time (Focus mode) */
  sbFocus: boolean;
  /** settings schema version, used for one-time migrations */
  v: number;
}

export type Screen = 'map' | 'chat' | 'camera' | 'stories' | 'spotlight';

export interface Backup {
  app: 'snapsim';
  version: 1;
  exportedAt: string;
  contacts: Contact[];
  messages: Record<string, Message[]>;
  stories: Story[];
  spotlight: SpotlightItem[];
  settings: Settings;
}
