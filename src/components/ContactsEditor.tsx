import { useEffect, useRef, useState } from 'react';
import { Emo } from './Emoji';
import { ChevronLeft, GripVertical, Pin, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useStore } from '../store';
import type { Contact } from '../types';
import { FRIEND_EMOJIS } from '../defaults';
import { loadImage, pickFile, STATUS_OPTIONS } from '../utils';
import { Avatar, Sheet, Toggle } from './common';

const ROW = 60;

export default function ContactsEditor() {
  const contacts = useStore((s) => s.contacts);
  const editId = useStore((s) => s.editContactId);
  const { setSheet, setEditContact, addContact, moveContact } = useStore.getState();
  const [drag, setDrag] = useState<{ from: number; dy: number; startY: number } | null>(null);

  const close = () => {
    setEditContact(null);
    setSheet(null);
  };
  const editing = contacts.find((c) => c.id === editId);
  if (editing) return <ContactForm c={editing} onBack={() => setEditContact(null)} onClose={close} />;

  const target = drag ? Math.max(0, Math.min(contacts.length - 1, drag.from + Math.round(drag.dy / ROW))) : -1;

  return (
    <Sheet title="Kontakte bearbeiten" onClose={close} full>
      <p className="pb-2 text-[12px] text-[#888]">Ziehen am Griff zum Sortieren · Tippen zum Bearbeiten. Angepinnte Kontakte stehen im Chat immer oben.</p>
      <div className="relative" style={{ height: contacts.length * ROW }} data-testid="editor-list">
        {contacts.map((c, i) => {
          let y = i * ROW;
          if (drag) {
            if (i === drag.from) y = i * ROW + drag.dy;
            else if (drag.from < target && i > drag.from && i <= target) y -= ROW;
            else if (drag.from > target && i < drag.from && i >= target) y += ROW;
          }
          const dragging = drag?.from === i;
          return (
            <div
              key={c.id}
              className="absolute inset-x-0 flex h-[56px] items-center gap-3 rounded-xl bg-[#262626] pl-2 pr-1"
              style={{
                transform: `translateY(${y}px)`,
                transition: dragging ? 'none' : 'transform .18s ease',
                zIndex: dragging ? 5 : 1,
                boxShadow: dragging ? '0 8px 24px rgba(0,0,0,.5)' : undefined,
              }}
            >
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditContact(c.id)} data-testid="editor-row">
                <Avatar src={c.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">
                    <Emo text={c.name} /> {c.pinned && <Pin size={12} className="inline" />}
                  </div>
                  <div className="text-[12px] text-[#999]">
                    <Emo text={c.showStreak && c.streak > 0 ? `${c.streak}🔥 · ` : ''} />
                    {c.timeMode === 'auto' ? 'Zeit automatisch' : c.timeLabel || '—'}
                  </div>
                </div>
              </button>
              <div className="flex flex-col">
                <button aria-label="Nach oben" className="px-2 text-[11px] text-[#aaa] disabled:opacity-30" disabled={i === 0} onClick={() => moveContact(i, i - 1)}>
                  ▲
                </button>
                <button aria-label="Nach unten" className="px-2 text-[11px] text-[#aaa] disabled:opacity-30" disabled={i === contacts.length - 1} onClick={() => moveContact(i, i + 1)}>
                  ▼
                </button>
              </div>
              <div
                aria-label="Ziehen zum Sortieren"
                className="flex h-full w-9 cursor-grab touch-none items-center justify-center text-[#888]"
                onPointerDown={(e) => {
                  (e.currentTarget as Element).setPointerCapture(e.pointerId);
                  setDrag({ from: i, dy: 0, startY: e.clientY });
                }}
                onPointerMove={(e) => drag && setDrag({ ...drag, dy: e.clientY - drag.startY })}
                onPointerUp={() => {
                  if (drag && target !== drag.from) moveContact(drag.from, target);
                  setDrag(null);
                }}
                onPointerCancel={() => setDrag(null)}
              >
                <GripVertical size={20} />
              </div>
            </div>
          );
        })}
      </div>
      <button className="sheet-btn mt-4" data-testid="add-contact" onClick={() => setEditContact(addContact())}>
        <Plus size={18} /> Kontakt hinzufügen
      </button>
    </Sheet>
  );
}

function ContactForm({ c, onBack, onClose }: { c: Contact; onBack: () => void; onClose: () => void }) {
  const { updateContact, removeContact, resetContact, showToast } = useStore.getState();
  const [crop, setCrop] = useState<string | null>(null);
  const up = (p: Partial<Contact>) => updateContact(c.id, p);

  return (
    <div className="no-export anim-right absolute inset-0 z-[61] flex flex-col bg-[#1c1c1c] pt-[var(--top)]" data-testid="contact-form">
      <div className="flex shrink-0 items-center gap-2 px-2 py-2">
        <button aria-label="Zurück" className="press p-1" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 truncate text-[17px] font-bold"><Emo text={c.name || 'Kontakt'} /></div>
        <button aria-label="Fertig" className="press flex h-8 w-8 items-center justify-center rounded-full bg-[#2f2f2f]" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="scroll min-h-0 flex-1 px-4 pb-[calc(24px+var(--sab))]">
        <div className="flex items-center gap-4 pt-1">
          <Avatar src={c.avatar} size={72} ring={c.storyRing} />
          <div className="flex flex-1 flex-col gap-2">
            <button className="sheet-btn py-2 text-[14px]" onClick={async () => setCrop(await pickAvatarSource())}>
              Avatar hochladen
            </button>
            {c.defaultId && (
              <button className="text-[13px] text-[#0EADFF]" onClick={() => up({ avatar: `avatars/${c.defaultId}.png` })}>
                Original-Avatar wiederherstellen
              </button>
            )}
          </div>
        </div>

        <label className="sheet-label">Name</label>
        <input className="sheet-input" value={c.name} onChange={(e) => up({ name: e.target.value })} data-testid="field-name" />

        <label className="sheet-label">Freundschafts-Emoji</label>
        <div className="flex flex-wrap gap-1.5">
          {FRIEND_EMOJIS.map((e) => (
            <button
              key={e || 'none'}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[18px]"
              style={{ background: c.friendEmoji === e ? '#0EADFF' : '#2a2a2a' }}
              onClick={() => up({ friendEmoji: e })}
            >
              {e ? <Emo text={e} /> : '∅'}
            </button>
          ))}
          <input className="sheet-input h-9 w-20 py-0 text-center" placeholder="eigenes" maxLength={8} onChange={(e) => e.target.value && up({ friendEmoji: e.target.value })} />
        </div>

        <Toggle label="Stern-Abzeichen neben Namen" checked={c.nameBadge === 'star'} onChange={(v) => up({ nameBadge: v ? 'star' : 'none' })} />

        <div className="mt-2 rounded-xl bg-[#242424] p-3">
          <div className="text-[15px] font-bold"><Emo text="Streak 🔥" /></div>
          <div className="mt-2 flex items-center gap-2">
            <button className="press h-10 w-10 rounded-full bg-[#3a3a3a] text-[20px]" onClick={() => up({ streak: Math.max(0, c.streak - 1) })}>
              −
            </button>
            <input
              className="sheet-input w-24 text-center text-[18px] font-bold"
              type="number"
              inputMode="numeric"
              value={c.streak}
              data-testid="field-streak"
              onChange={(e) => up({ streak: Math.max(0, parseInt(e.target.value) || 0), showStreak: true })}
            />
            <button className="press h-10 w-10 rounded-full bg-[#3a3a3a] text-[20px]" onClick={() => up({ streak: c.streak + 1, showStreak: true })}>
              +
            </button>
          </div>
          <Toggle label="Streak anzeigen" checked={c.showStreak} onChange={(v) => up({ showStreak: v })} />
          <Toggle label={<Emo text="Sanduhr ⏳ (Streak läuft ab)" />} checked={c.hourglass} onChange={(v) => up({ hourglass: v })} />
          <label className="sheet-label">Fortschritt</label>
          <select className="sheet-input" value={c.streakMode} onChange={(e) => up({ streakMode: e.target.value as Contact['streakMode'], lastStreakBump: Date.now() })}>
            <option value="manual">Manuell – ändert sich nie von selbst</option>
            <option value="daily">+1 beim ersten gesendeten Snap pro Tag</option>
          </select>
          <div className="mt-1 text-[11px] text-[#888]">Letzte Interaktion: {new Date(c.lastInteraction).toLocaleString('de-DE')}</div>
        </div>

        <label className="sheet-label">Status</label>
        <select className="sheet-input" value={c.status} onChange={(e) => up({ status: e.target.value as Contact['status'] })} data-testid="field-status">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="sheet-label">Angezeigte Zeit</label>
        <div className="flex gap-2">
          <input
            className="sheet-input"
            value={c.timeLabel}
            disabled={c.timeMode === 'auto'}
            placeholder="z. B. 1h, 23 Min., 2 T."
            onChange={(e) => up({ timeLabel: e.target.value, timeMode: 'fixed' })}
          />
          <button
            className="press shrink-0 rounded-xl px-3 text-[13px] font-semibold"
            style={{ background: c.timeMode === 'auto' ? '#0EADFF' : '#2a2a2a' }}
            onClick={() => up({ timeMode: c.timeMode === 'auto' ? 'fixed' : 'auto' })}
          >
            Auto
          </button>
        </div>

        <Toggle label={<Emo text="Angepinnt 📌" />} checked={c.pinned} onChange={(v) => up({ pinned: v })} />
        <label className="sheet-label">Story-Ring</label>
        <select className="sheet-input" value={c.storyRing} onChange={(e) => up({ storyRing: e.target.value as Contact['storyRing'] })}>
          <option value="none">Keiner</option>
          <option value="unseen">Neue Story (lila)</option>
          <option value="seen">Gesehen (grau)</option>
        </select>
        <Toggle label="Automatische Antworten" checked={c.autoReply} onChange={(v) => up({ autoReply: v })} />

        <div className="mt-4 flex flex-col gap-2">
          <button
            className="sheet-btn"
            onClick={() => {
              if (!confirm('Diesen Kontakt auf den Ausgangszustand zurücksetzen?')) return;
              resetContact(c.id);
              showToast('Kontakt zurückgesetzt');
            }}
          >
            <RotateCcw size={17} /> Kontakt zurücksetzen
          </button>
          <button
            className="sheet-btn text-[#ff453a]"
            onClick={() => {
              if (!confirm(`„${c.name}“ und den Chatverlauf löschen?`)) return;
              removeContact(c.id);
              onBack();
            }}
          >
            <Trash2 size={17} /> Kontakt löschen
          </button>
        </div>
      </div>
      {crop && <AvatarCropper src={crop} onClose={() => setCrop(null)} onDone={(url) => up({ avatar: url })} />}
    </div>
  );
}

/** Opens the photo picker (must be called from a tap) and resolves with a data URL. */
export async function pickAvatarSource(): Promise<string | null> {
  const f = await pickFile('image/*');
  if (!f) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(f);
  });
}

/** Pan/zoom an image inside a circle, export a 320px PNG. */
export function AvatarCropper({ src, onClose, onDone }: { src: string; onClose: () => void; onDone: (dataUrl: string) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const V = 260;

  useEffect(() => {
    loadImage(src).then(setImg, onClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (!img) {
    return (
      <div className="no-export absolute inset-0 z-[80] flex items-center justify-center bg-black/80 text-[#aaa]" onClick={onClose}>
        Bild auswählen …
      </div>
    );
  }
  const base = Math.max(V / img.naturalWidth, V / img.naturalHeight);
  const w = img.naturalWidth * base * zoom;
  const h = img.naturalHeight * base * zoom;

  const save = () => {
    const OUT = 320;
    const c = document.createElement('canvas');
    c.width = c.height = OUT;
    const ctx = c.getContext('2d')!;
    const k = OUT / V;
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, (V / 2 - w / 2 + off.x) * k, (V / 2 - h / 2 + off.y) * k, w * k, h * k);
    onDone(c.toDataURL('image/png'));
    onClose();
  };

  return (
    <div className="no-export anim-fade absolute inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-black/95 px-6">
      <div className="text-[17px] font-bold">Avatar zuschneiden</div>
      <div
        className="relative touch-none overflow-hidden rounded-full bg-[#222]"
        style={{ width: V, height: V }}
        onPointerDown={(e) => {
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setOff({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none"
          style={{ width: w, height: h, left: V / 2 - w / 2 + off.x, top: V / 2 - h / 2 + off.y }}
        />
      </div>
      <input aria-label="Zoom" className="w-full" type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} />
      <div className="flex w-full gap-3">
        <button className="sheet-btn" onClick={onClose}>
          Abbrechen
        </button>
        <button className="press flex w-full items-center justify-center rounded-xl bg-[#FFFC00] py-3 font-bold text-black" onClick={save}>
          Übernehmen
        </button>
      </div>
    </div>
  );
}
