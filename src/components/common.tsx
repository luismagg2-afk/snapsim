import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { GenericAvatar } from './icons';
import { useStore } from '../store';

export function Avatar({
  src,
  size,
  ring = 'none',
  bg = '#2a2a2a',
}: {
  src?: string;
  size: number;
  ring?: 'none' | 'unseen' | 'seen';
  bg?: string;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const inner = (
    <div className="overflow-hidden rounded-full" style={{ width: size, height: size, background: bg }}>
      {src && !broken ? (
        <img src={src} alt="" draggable={false} onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <GenericAvatar size={size} />
      )}
    </div>
  );
  if (ring === 'none') return inner;
  const pad = Math.round(size * 0.09);
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size + pad * 2,
        height: size + pad * 2,
        margin: -pad,
        border: `${Math.max(2, Math.round(size * 0.055))}px solid ${ring === 'unseen' ? '#A05DCD' : '#7c7c7c'}`,
      }}
    >
      {inner}
    </div>
  );
}

/** Simulated iOS status bar – only drawn where the real one isn't present (desktop preview, exports). */
export function StatusBar() {
  const s = useStore((x) => x.settings);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!s.sbAutoTime) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [s.sbAutoTime]);
  const time = s.sbAutoTime ? now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : s.sbTime;
  const battery = Math.max(0, Math.min(100, s.sbBattery));
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[95] h-[59px]">
      <div className="absolute left-0 top-[17px] flex w-[110px] items-center justify-center gap-[3px] text-[17px] font-semibold tracking-[-0.2px] text-white">
        {time}
        {s.sbFocus && (
          <svg width="12" height="13" viewBox="0 0 12 13" aria-hidden>
            <circle cx="6" cy="3.4" r="3" fill="#fff" />
            <path d="M0 12.2c0-3.3 2.7-5 6-5s6 1.7 6 5Z" fill="#fff" />
          </svg>
        )}
      </div>
      {s.sbIsland && <div className="absolute left-1/2 top-[11px] h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-black" />}
      <div className="absolute right-[26px] top-[20px] flex items-center gap-[7px]">
        <div className="flex h-[12px] items-end gap-[2px]">
          {[4, 6.5, 9, 12].map((h, i) => (
            <div key={i} className="w-[3.3px] rounded-[1px]" style={{ height: h, background: i < s.sbSignal ? '#fff' : '#5a5a5a' }} />
          ))}
        </div>
        {s.sbWifi && (
          <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden>
            <path d="M8.5 2.3c2.4 0 4.6.9 6.2 2.5l1.2-1.2A10.4 10.4 0 0 0 8.5.6 10.4 10.4 0 0 0 1.1 3.6l1.2 1.2a8.7 8.7 0 0 1 6.2-2.5Z" fill="#fff" />
            <path d="M8.5 5.6c1.5 0 2.9.6 3.9 1.6l1.2-1.2a7.2 7.2 0 0 0-10.2 0l1.2 1.2c1-1 2.4-1.6 3.9-1.6Z" fill="#fff" />
            <path d="M8.5 8.8c.6 0 1.2.3 1.6.7L8.5 11.2 6.9 9.5c.4-.4 1-.7 1.6-.7Z" fill="#fff" />
          </svg>
        )}
        <div className="relative flex items-center">
          <div className="relative h-[13.5px] w-[27px] overflow-hidden rounded-[4.3px] bg-[#5f5f5f]">
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${battery}%`, background: battery <= 20 ? '#ff3b30' : '#fff' }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center text-[11px] font-bold leading-none tracking-[-0.3px]"
              style={{ color: battery > 45 ? '#000' : '#fff', mixBlendMode: battery > 45 ? 'normal' : 'normal' }}
            >
              {battery}
            </div>
          </div>
          <div className="ml-[1px] h-[4.5px] w-[1.6px] rounded-r-sm bg-[#5f5f5f]" />
        </div>
      </div>
    </div>
  );
}

export function Sheet({
  title,
  onClose,
  children,
  full,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className="no-export absolute inset-0 z-[60] flex flex-col justify-end bg-black/60 anim-fade" onClick={onClose}>
      <div
        className={`anim-up mx-auto flex w-full max-w-[560px] flex-col rounded-t-[22px] bg-[#1c1c1c] ${full ? 'h-[calc(100%-var(--top))]' : 'max-h-[88%]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
          <div className="text-[18px] font-bold">{title}</div>
          <button aria-label="Schließen" className="press flex h-8 w-8 items-center justify-center rounded-full bg-[#2f2f2f]" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="scroll min-h-0 flex-1 px-4 pb-[calc(16px+var(--sab))]">{children}</div>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors"
        style={{ background: checked ? '#34C759' : '#3a3a3a' }}
      >
        <span
          className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </label>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="no-export pointer-events-none absolute inset-x-0 top-[calc(var(--top)+12px)] z-[90] flex justify-center px-6">
      <div className="anim-pop rounded-2xl bg-[#2c2c2c]/95 px-4 py-2.5 text-center text-[14px] font-medium shadow-lg">{toast}</div>
    </div>
  );
}

export function useLongPress(onLong: () => void, onTap?: () => void, ms = 480) {
  const r = useRef<{ timer: ReturnType<typeof setTimeout> | null; fired: boolean; x: number; y: number; moved: boolean }>({
    timer: null,
    fired: false,
    x: 0,
    y: 0,
    moved: false,
  });
  const clear = () => {
    if (r.current.timer) clearTimeout(r.current.timer);
    r.current.timer = null;
  };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button > 0) return;
      clear();
      Object.assign(r.current, { fired: false, moved: false, x: e.clientX, y: e.clientY });
      r.current.timer = setTimeout(() => {
        r.current.fired = true;
        r.current.timer = null;
        navigator.vibrate?.(10);
        onLong();
      }, ms);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (Math.hypot(e.clientX - r.current.x, e.clientY - r.current.y) > 10) {
        r.current.moved = true;
        clear();
      }
    },
    onPointerUp: () => {
      const wasPending = !!r.current.timer;
      clear();
      if (wasPending && !r.current.fired && !r.current.moved) onTap?.();
    },
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
