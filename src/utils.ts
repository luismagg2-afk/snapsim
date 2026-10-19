import type { StatusKind } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Snapchat-style German relative time ("Jetzt", "5 Min.", "2h", "3T", "8W"). */
export function relTime(ts: number, now = Date.now()) {
  const s = Math.max(0, (now - ts) / 1000);
  if (s < 60) return 'Jetzt';
  if (s < 3600) return `${Math.floor(s / 60)} Min.`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}T`;
  return `${Math.floor(s / (7 * 86400))}W`;
}

/** Snapchat Web style ("Jetzt", "35 Min.", "2 Std.", "3. Okt."). */
export function relTimeWeb(ts: number, now = Date.now()) {
  const s = Math.max(0, (now - ts) / 1000);
  if (s < 60) return 'Jetzt';
  if (s < 3600) return `${Math.floor(s / 60)} Min.`;
  if (s < 86400) return `${Math.floor(s / 3600)} Std.`;
  return new Date(ts).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }).replace(/\.$/, '') + '.';
}

/** Converts a phone-style fixed label ("2h", "3 T.") to the web wording. */
export function webLabel(label: string) {
  const h = /^(\d+)\s*h$/i.exec(label.trim());
  if (h) return `${h[1]} Std.`;
  return label;
}

export const clockTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

export function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date(Date.now() - 86400_000);
  if (d.toDateString() === today.toDateString()) return 'HEUTE';
  if (d.toDateString() === y.toDateString()) return 'GESTERN';
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

export interface StatusInfo {
  label: string;
  color: 'red' | 'blue' | 'purple' | 'grey';
  shape: 'arrow' | 'square' | 'none';
  filled: boolean;
  bold?: boolean;
}

export const STATUS_INFO: Record<StatusKind, StatusInfo> = {
  sent_snap_delivered: { label: 'Zugestellt', color: 'red', shape: 'arrow', filled: true },
  sent_snap_opened: { label: 'Geöffnet', color: 'red', shape: 'arrow', filled: false },
  sent_chat_delivered: { label: 'Zugestellt', color: 'blue', shape: 'arrow', filled: true },
  sent_chat_opened: { label: 'Geöffnet', color: 'blue', shape: 'arrow', filled: false },
  sent_video_delivered: { label: 'Zugestellt', color: 'purple', shape: 'arrow', filled: true },
  sent_video_opened: { label: 'Geöffnet', color: 'purple', shape: 'arrow', filled: false },
  new_snap: { label: 'Neuer Snap', color: 'red', shape: 'square', filled: true, bold: true },
  new_chat: { label: 'Neuer Chat', color: 'blue', shape: 'square', filled: true, bold: true },
  new_video: { label: 'Neuer Snap', color: 'purple', shape: 'square', filled: true, bold: true },
  received_snap: { label: 'Empfangen', color: 'red', shape: 'square', filled: false },
  received_chat: { label: 'Empfangen', color: 'blue', shape: 'square', filled: false },
  received_video: { label: 'Empfangen', color: 'purple', shape: 'square', filled: false },
  tap_to_chat: { label: 'Zum Chatten tippen', color: 'grey', shape: 'none', filled: false },
};

export const STATUS_OPTIONS: { value: StatusKind; label: string }[] = [
  { value: 'sent_snap_delivered', label: 'Snap sent · Zugestellt (red filled arrow)' },
  { value: 'sent_snap_opened', label: 'Snap sent · Geöffnet (red outlined arrow)' },
  { value: 'sent_chat_delivered', label: 'Chat sent · Zugestellt (blue filled arrow)' },
  { value: 'sent_chat_opened', label: 'Chat sent · Geöffnet (blue outlined arrow)' },
  { value: 'sent_video_delivered', label: 'Video sent · Zugestellt (purple filled)' },
  { value: 'sent_video_opened', label: 'Video sent · Geöffnet (purple outlined)' },
  { value: 'new_snap', label: 'New Snap (red filled square)' },
  { value: 'new_chat', label: 'New Chat (blue filled square)' },
  { value: 'new_video', label: 'New video Snap (purple filled square)' },
  { value: 'received_snap', label: 'Snap received · Empfangen (red outlined)' },
  { value: 'received_chat', label: 'Chat received · Empfangen (blue outlined)' },
  { value: 'received_video', label: 'Video received · Empfangen (purple outlined)' },
  { value: 'tap_to_chat', label: 'Zum Chatten tippen' },
];

/** Reads an image file/data URL and downsizes it to a JPEG data URL to keep IndexedDB small. */
export async function compressImage(src: File | Blob | string, max = 1440, quality = 0.85): Promise<string> {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } finally {
    if (typeof src !== 'string') URL.revokeObjectURL(url);
  }
}

export function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = url;
  });
}

/** Like pickFile, but lets the user choose several images at once. */
export function pickFiles(accept = 'image/*'): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.style.display = 'none';
    input.onchange = () => {
      resolve(Array.from(input.files ?? []));
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
  });
}

export function pickFile(accept = 'image/*', capture?: 'user' | 'environment'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) input.setAttribute('capture', capture);
    input.style.display = 'none';
    input.onchange = () => {
      resolve(input.files?.[0] ?? null);
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

/** Shares a file via the iOS share sheet when available, otherwise downloads it. */
export async function shareOrDownload(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (isIOS() && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  downloadBlob(blob, filename);
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob();
}
