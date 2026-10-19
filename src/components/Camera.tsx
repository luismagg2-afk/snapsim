import { useCallback, useEffect, useRef, useState } from 'react';
import { Emo } from './Emoji';
import {
  Bell,
  CameraOff,
  Check,
  ChevronDown,
  CircleStop,
  Download,
  Gamepad2,
  Images,
  Maximize2,
  Music,
  Pencil,
  Repeat,
  Search,
  Send,
  SmilePlus,
  Sparkles,
  Type,
  Undo2,
  X,
  Zap,
  ZapOff,
} from 'lucide-react';
import { AddFriendIcon } from './icons';
import { applyFilter, cssFilter, FILTERS, type CamFilter } from '../filters';
import { useStore } from '../store';
import { compressImage, dataUrlToBlob, loadImage, pickFile, shareOrDownload, uid } from '../utils';
import { Avatar } from './common';

type Facing = 'user' | 'environment';

/** web: Snapchat-Web look (camera inside the centre card, X / ••• / shutter ring). */
export default function CameraScreen({ web, onClose }: { web?: boolean; onClose?: () => void } = {}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [final, setFinal] = useState<string | null>(null);
  if (final) return <SendTo image={final} onBack={() => setFinal(null)} />;
  if (photo) return <SnapEditor photo={photo} onClose={() => setPhoto(null)} onDone={setFinal} />;
  return <LiveCamera onPhoto={setPhoto} web={web} onClose={onClose} />;
}

function cameraError(e: unknown): string {
  const name = (e as Error)?.name;
  if (!window.isSecureContext) return 'Die Kamera funktioniert nur über HTTPS. Öffne die App über die gehostete https-Adresse.';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Kamerazugriff wurde verweigert. Erlaube ihn unter Einstellungen → Safari → Kamera (oder tippe auf „aA“ → Website-Einstellungen).';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Keine Kamera gefunden.';
  if (name === 'NotReadableError') return 'Die Kamera wird gerade von einer anderen App verwendet.';
  return 'Kamera nicht verfügbar' + (name ? ` (${name})` : '') + '.';
}

function LiveCamera({ onPhoto, web, onClose }: { onPhoto: (img: string) => void; web?: boolean; onClose?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>('user');
  const [state, setState] = useState<'idle' | 'starting' | 'live' | 'error'>('idle');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [filterIdx, setFilterIdx] = useState(0);
  const filter = FILTERS[filterIdx];
  const myAvatar = useStore((s) => s.settings.myAvatar);
  const showPlaceholder = useStore((s) => s.showPlaceholder);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = useCallback(async (f: Facing) => {
    stop();
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(cameraError(new Error('unsupported')));
      setState('error');
      return;
    }
    setState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: f, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => undefined);
      }
      setState('live');
    } catch (e) {
      console.warn('camera error', e);
      setError(cameraError(e));
      setState('error');
    }
  }, []);

  useEffect(() => {
    start(facing);
    return stop;
  }, [facing, start]);

  const capture = async () => {
    const v = videoRef.current;
    if (!v || state !== 'live' || !v.videoWidth) return;
    if (flash && facing === 'user') {
      setFlashing(true);
      await new Promise((r) => setTimeout(r, 180));
    }
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    if (facing === 'user') {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    if (facing === 'user') ctx.setTransform(1, 0, 0, 1, 0, 0);
    applyFilter(c, filter);
    setFlashing(false);
    onPhoto(await compressImage(c.toDataURL('image/jpeg', 0.92)));
  };

  const upload = async () => {
    const f = await pickFile('image/*');
    if (f) onPhoto(await filteredImage(await compressImage(f), filter));
  };

  return (
    <div className="absolute inset-0 bg-black" data-testid="camera">
      {/* phone: preview with rounded top corners between status bar and tab bar, like the iOS app */}
      <div
        className={web ? 'absolute inset-0 overflow-hidden' : 'absolute inset-x-0 overflow-hidden rounded-t-[17px] bg-[#1b1b1b]'}
        style={web ? undefined : { top: 'var(--top)', bottom: 'var(--nav)' }}
      >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined, opacity: state === 'live' ? 1 : 0, filter: cssFilter(filter) }}
      />
      {state !== 'live' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1b1b1b] px-8 text-center">
          {state === 'error' ? (
            <>
              <CameraOff size={44} color="#888" />
              <div className="mt-4 text-[17px] font-bold">Kamera nicht verfügbar</div>
              <div className="mt-2 text-[14px] leading-snug text-[#aaa]" data-testid="camera-error">
                {error}
              </div>
              <button className="press mt-6 w-full rounded-full bg-[#FFFC00] py-3 text-[16px] font-bold text-black" onClick={upload}>
                Foto hochladen
              </button>
              <button className="press mt-3 w-full rounded-full bg-[#2a2a2a] py-3 text-[15px] font-semibold" onClick={() => start(facing)}>
                Erneut versuchen
              </button>
            </>
          ) : (
            <div className="text-[15px] text-[#aaa]">Kamera wird gestartet…</div>
          )}
        </div>
      )}
      {flashing && <div className="absolute inset-0 z-20 bg-white" />}

      {web ? (
        <>
          <button
            aria-label="Kamera schließen"
            className="press absolute left-[10px] top-[10px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/40"
            onClick={onClose}
          >
            <X size={19} strokeWidth={3} />
          </button>
          <button
            aria-label="Kamera-Optionen"
            className="press absolute right-[10px] top-[10px] z-10 flex h-[34px] w-[34px] items-center justify-center gap-[3px] rounded-full bg-black/40"
            onClick={() => setMenu((v) => !v)}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[4px] w-[4px] rounded-full bg-white" />
            ))}
          </button>
          {menu && (
            <div className="anim-pop absolute right-[10px] top-[50px] z-20 w-[190px] overflow-hidden rounded-xl bg-[#2a2a2a] text-[14px] font-semibold shadow-xl">
              {(
                [
                  ['Kamera wechseln', () => setFacing((f) => (f === 'user' ? 'environment' : 'user'))],
                  [flash ? 'Blitz aus' : 'Blitz an', () => setFlash((v) => !v)],
                  ['Foto hochladen', upload],
                ] as const
              ).map(([label, fn]) => (
                <button
                  key={label}
                  className="block w-full border-b border-[#3a3a3a] px-4 py-2.5 text-left last:border-0 hover:bg-[#333]"
                  onClick={() => {
                    setMenu(false);
                    fn();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {state === 'live' && (
            <button
              aria-label="Foto aufnehmen"
              data-testid="shutter"
              className="press absolute bottom-[36px] left-1/2 z-10 h-[64px] w-[64px] -translate-x-1/2 rounded-full border-[4px] border-white"
              onClick={capture}
            />
          )}
        </>
      ) : (
        <PhoneControls
          live={state === 'live'}
          flash={flash}
          onFlip={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          onFlash={() => setFlash((v) => !v)}
          onShutter={state === 'live' ? capture : upload}
          onMemories={upload}
          myAvatar={myAvatar}
          placeholder={showPlaceholder}
          filterIdx={filterIdx}
          onFilter={setFilterIdx}
        />
      )}
      </div>
    </div>
  );
}

interface TextOverlay {
  id: string;
  text: string;
  x: number; // 0..1 centre
  y: number; // 0..1 centre
  scale: number;
  style: 'bar' | 'big';
  color: string;
}
interface Stroke {
  color: string;
  width: number; // relative to container width
  points: [number, number][]; // normalised
}

const PALETTE = ['#ffffff', '#000000', '#FFFC00', '#F23C57', '#0EADFF', '#34C759', '#A05DCD', '#FF9500'];

function SnapEditor({ photo, onClose, onDone }: { photo: string; onClose: () => void; onDone: (img: string) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'none' | 'draw'>('none');
  const [color, setColor] = useState('#F23C57');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const drawing = useRef<Stroke | null>(null);
  const showToast = useStore((s) => s.showToast);

  // redraw strokes
  useEffect(() => {
    const c = canvasRef.current;
    const box = boxRef.current;
    if (!c || !box) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = box.clientWidth * dpr;
    c.height = box.clientHeight * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    drawStrokes(ctx, strokes, box.clientWidth, box.clientHeight);
  }, [strokes]);

  const pos = (e: React.PointerEvent): [number, number] => {
    const r = boxRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  const onDrawDown = (e: React.PointerEvent) => {
    if (mode !== 'draw') {
      setSelected(null);
      setEditing(null);
      return;
    }
    (e.target as Element).setPointerCapture(e.pointerId);
    drawing.current = { color, width: 0.014, points: [pos(e)] };
  };
  const onDrawMove = (e: React.PointerEvent) => {
    const s = drawing.current;
    if (!s) return;
    s.points.push(pos(e));
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const box = boxRef.current!;
    drawStrokes(ctx, [{ ...s, points: s.points.slice(-2) }], box.clientWidth, box.clientHeight);
  };
  const onDrawUp = () => {
    const s = drawing.current;
    drawing.current = null;
    if (s) setStrokes((list) => [...list, s]);
  };

  const addText = () => {
    if (selected) {
      // tapping T on a selected caption cycles its style
      setTexts((l) => l.map((t) => (t.id === selected ? { ...t, style: t.style === 'bar' ? 'big' : 'bar' } : t)));
      return;
    }
    const id = uid();
    setTexts((l) => [...l, { id, text: '', x: 0.5, y: 0.45, scale: 1, style: 'bar', color: '#ffffff' }]);
    setEditing(id);
    setSelected(id);
    setMode('none');
  };

  const render = async () => {
    const box = boxRef.current!;
    const W = 1080;
    const H = Math.round((W * box.clientHeight) / box.clientWidth);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const img = await loadImage(photo);
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    ctx.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    drawStrokes(ctx, strokes, W, H);
    for (const t of texts.filter((t) => t.text.trim())) drawText(ctx, t, W, H);
    return c.toDataURL('image/jpeg', 0.9);
  };

  const sel = texts.find((t) => t.id === selected);

  return (
    <div className="absolute inset-0 z-[45] bg-black" data-testid="snap-editor">
      <div
        ref={boxRef}
        className="absolute inset-0 touch-none"
        onPointerDown={onDrawDown}
        onPointerMove={onDrawMove}
        onPointerUp={onDrawUp}
        onPointerCancel={onDrawUp}
      >
        <img src={photo} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        {texts.map((t) => (
          <TextItem
            key={t.id}
            t={t}
            boxRef={boxRef}
            editing={editing === t.id}
            selected={selected === t.id}
            onSelect={() => {
              setSelected(t.id);
              setMode('none');
            }}
            onEdit={() => setEditing(t.id)}
            onChange={(p) => setTexts((l) => l.map((x) => (x.id === t.id ? { ...x, ...p } : x)))}
            onBlur={() => {
              setEditing(null);
              setTexts((l) => l.filter((x) => x.id !== t.id || x.text.trim()));
            }}
          />
        ))}
      </div>

      {/* close */}
      <button aria-label="Verwerfen" className="press absolute left-3 top-[calc(var(--top)+6px)] z-10 rounded-full bg-black/30 p-2" onClick={onClose}>
        <X size={26} />
      </button>

      {/* tools */}
      <div className="absolute right-3 top-[calc(var(--top)+6px)] z-10 flex flex-col items-center gap-3">
        <button aria-label="Text" data-testid="tool-text" className={`press rounded-full p-2 ${selected ? 'bg-white/30' : 'bg-black/30'}`} onClick={addText}>
          <Type size={26} />
        </button>
        <button
          aria-label="Zeichnen"
          data-testid="tool-draw"
          className="press rounded-full p-2"
          style={{ background: mode === 'draw' ? color : 'rgba(0,0,0,.3)' }}
          onClick={() => setMode((m) => (m === 'draw' ? 'none' : 'draw'))}
        >
          <Pencil size={24} color={mode === 'draw' && color === '#ffffff' ? '#000' : '#fff'} />
        </button>
        {(mode === 'draw' || sel) && (
          <div className="flex flex-col gap-2 rounded-full bg-black/30 p-1.5">
            {PALETTE.map((p) => (
              <button
                key={p}
                aria-label={`Farbe ${p}`}
                className="h-[22px] w-[22px] rounded-full border-2"
                style={{ background: p, borderColor: (sel ? sel.color : color) === p ? '#fff' : 'transparent' }}
                onClick={() => (sel ? setTexts((l) => l.map((x) => (x.id === sel.id ? { ...x, color: p } : x))) : setColor(p))}
              />
            ))}
          </div>
        )}
        {mode === 'draw' && strokes.length > 0 && (
          <button aria-label="Rückgängig" className="press rounded-full bg-black/30 p-2" onClick={() => setStrokes((s) => s.slice(0, -1))}>
            <Undo2 size={22} />
          </button>
        )}
      </div>

      {/* size slider for the selected text */}
      {sel && !editing && (
        <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/30 px-1 py-3">
          <span className="text-[11px]">A</span>
          <input
            aria-label="Textgröße"
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={sel.scale}
            onChange={(e) => setTexts((l) => l.map((x) => (x.id === sel.id ? { ...x, scale: +e.target.value } : x)))}
            style={{ writingMode: 'vertical-lr' as never, direction: 'rtl', height: 160, width: 24 }}
          />
          <span className="text-[17px] font-bold">A</span>
        </div>
      )}

      {/* bottom actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-4 pb-[calc(14px+var(--sab))] pt-3">
        <button
          aria-label="Speichern"
          className="press flex h-[44px] items-center gap-2 whitespace-nowrap rounded-full bg-black/40 px-4 text-[15px] font-semibold"
          onClick={async () => {
            await shareOrDownload(await dataUrlToBlob(await render()), `snap-${Date.now()}.jpg`);
            showToast('Snap gespeichert');
          }}
        >
          <Download size={20} /> Speichern
        </button>
        <button
          data-testid="send-to"
          className="press flex h-[48px] items-center gap-2 whitespace-nowrap rounded-full bg-[#0EADFF] pl-5 pr-4 text-[16px] font-bold"
          onClick={async () => onDone(await render())}
        >
          Senden an <Send size={18} fill="#fff" />
        </button>
      </div>
    </div>
  );
}

function TextItem({
  t,
  boxRef,
  editing,
  selected,
  onSelect,
  onEdit,
  onChange,
  onBlur,
}: {
  t: TextOverlay;
  boxRef: React.RefObject<HTMLDivElement>;
  editing: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onChange: (p: Partial<TextOverlay>) => void;
  onBlur: () => void;
}) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; tx: number; ty: number; dist: number; scale: number; moved: boolean } | null>(null);

  const down = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (editing) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y, dist, scale: t.scale, moved: false };
    onSelect();
  };
  const move = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = boxRef.current!.getBoundingClientRect();
    const pts = [...pointers.current.values()];
    if (pts.length > 1 && g.dist) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      onChange({ scale: Math.max(0.5, Math.min(3, (g.scale * d) / g.dist)) });
      g.moved = true;
      return;
    }
    const dx = (e.clientX - g.x) / r.width;
    const dy = (e.clientY - g.y) / r.height;
    if (Math.abs(dx) + Math.abs(dy) > 0.005) g.moved = true;
    onChange({
      x: t.style === 'bar' ? 0.5 : Math.max(0.05, Math.min(0.95, g.tx + dx)),
      y: Math.max(0.05, Math.min(0.95, g.ty + dy)),
    });
  };
  const up = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (gesture.current && !gesture.current.moved && pointers.current.size === 0 && selected) onEdit();
    if (pointers.current.size === 0) gesture.current = null;
  };

  const common = 'absolute -translate-x-1/2 -translate-y-1/2 touch-none';
  const style: React.CSSProperties = { left: `${t.x * 100}%`, top: `${t.y * 100}%` };
  const bar = t.style === 'bar';
  const fontSize = (bar ? 18 : 34) * t.scale;
  const textStyle: React.CSSProperties = bar
    ? { fontSize, color: t.color, fontWeight: 500 }
    : { fontSize, color: t.color, fontWeight: 800, WebkitTextStroke: t.color === '#000000' ? undefined : `${Math.max(1, fontSize / 22)}px #000`, paintOrder: 'stroke fill' };

  return (
    <div
      className={common}
      style={{ ...style, width: bar ? '100%' : undefined }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <div
        className={bar ? 'w-full bg-black/60 px-3 py-[6px] text-center' : 'whitespace-pre px-1 text-center'}
        style={{ outline: selected && !editing ? '1px dashed rgba(255,255,255,.5)' : 'none' }}
      >
        {editing ? (
          <input
            autoFocus
            value={t.text}
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={onBlur}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-full bg-transparent text-center outline-none"
            style={{ ...textStyle, fontSize: Math.max(16, fontSize) }}
            data-testid="text-input"
          />
        ) : (
          <span style={textStyle}>{t.text}</span>
        )}
      </div>
    </div>
  );
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], W: number, H: number) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * W;
    ctx.beginPath();
    s.points.forEach(([x, y], i) => (i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)));
    if (s.points.length === 1) ctx.lineTo(s.points[0][0] * W + 0.1, s.points[0][1] * H);
    ctx.stroke();
  }
}

function drawText(ctx: CanvasRenderingContext2D, t: TextOverlay, W: number, H: number) {
  const k = W / 393; // editor is laid out in CSS px on a ~393px wide screen
  const font = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (t.style === 'bar') {
    const size = 18 * t.scale * k;
    ctx.font = `500 ${size}px ${font}`;
    const bh = size + 12 * k;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, t.y * H - bh / 2, W, bh);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, W / 2, t.y * H);
  } else {
    const size = 34 * t.scale * k;
    ctx.font = `800 ${size}px ${font}`;
    if (t.color !== '#000000') {
      ctx.lineWidth = Math.max(1, size / 22) * 2;
      ctx.strokeStyle = '#000';
      ctx.strokeText(t.text, t.x * W, t.y * H);
    }
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x * W, t.y * H);
  }
}

function SendTo({ image, onBack }: { image: string; onBack: () => void }) {
  const contacts = useStore((s) => s.contacts);
  const cameraFor = useStore((s) => s.cameraFor);
  const { sendSnap, setScreen, showToast, openChat } = useStore.getState();
  const [sel, setSel] = useState<Set<string>>(() => new Set(cameraFor ? [cameraFor] : []));
  const [story, setStory] = useState(false);
  const [q, setQ] = useState('');
  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const names = [story ? 'Meine Story' : null, ...contacts.filter((c) => sel.has(c.id)).map((c) => c.name)].filter(Boolean);
  const list = contacts.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  const Check_ = ({ on }: { on: boolean }) => (
    <div
      className="flex h-[24px] w-[24px] items-center justify-center rounded-full border-2"
      style={{ borderColor: on ? '#0EADFF' : '#555', background: on ? '#0EADFF' : 'transparent' }}
    >
      {on && <Check size={15} strokeWidth={3.5} />}
    </div>
  );

  return (
    <div className="anim-right absolute inset-0 z-[45] flex flex-col bg-[#121212]" data-testid="send-to-screen">
      <div className="flex shrink-0 items-center gap-2 px-2 pb-2 pt-[calc(var(--top)+6px)]">
        <button aria-label="Zurück" className="press p-2" onClick={onBack}>
          <X size={24} />
        </button>
        <div className="flex h-[38px] flex-1 items-center gap-2 rounded-full bg-[#2a2a2a] px-3">
          <Search size={17} color="#999" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Senden an …" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#888]" />
        </div>
      </div>
      <div className="scroll min-h-0 flex-1 pb-[100px]">
        <div className="px-4 pb-1 pt-3 text-[13px] font-bold text-[#A6A6A6]">Stories</div>
        <button className="row-press flex w-full items-center gap-3 px-4 py-2" onClick={() => setStory((v) => !v)}>
          <div className="h-[42px] w-[42px] overflow-hidden rounded-full border-2 border-[#A05DCD]">
            <img src={image} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="flex-1 text-left text-[16px] font-medium">Meine Story</span>
          <Check_ on={story} />
        </button>
        <div className="px-4 pb-1 pt-4 text-[13px] font-bold text-[#A6A6A6]">Freunde</div>
        {list.map((c) => (
          <button key={c.id} className="row-press flex w-full items-center gap-3 px-4 py-2" onClick={() => toggle(c.id)} data-testid="recipient">
            <Avatar src={c.avatar} size={42} />
            <span className="min-w-0 flex-1 truncate text-left text-[16px] font-medium">
              <Emo text={c.name} /> {c.showStreak && c.streak > 0 && <span className="text-[13px] text-[#A6A6A6]">{c.streak}<Emo text="🔥" /></span>}
            </span>
            <Check_ on={sel.has(c.id)} />
          </button>
        ))}
      </div>
      {names.length > 0 && (
        <div className="anim-up absolute inset-x-0 bottom-0 flex items-center gap-3 bg-[#0EADFF] px-4 pb-[calc(12px+var(--sab))] pt-3">
          <div className="min-w-0 flex-1 truncate text-[15px] font-semibold"><Emo text={names.join(', ')} /></div>
          <button
            aria-label="Snap senden"
            data-testid="send-snap"
            className="press flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white"
            onClick={() => {
              sendSnap(image, [...sel], story);
              showToast(`Snap gesendet (lokale Simulation)`);
              setScreen('chat');
              openChat(null);
            }}
          >
            <Send size={20} color="#0EADFF" fill="#0EADFF" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Runs a filter over an image data URL (used for photos picked from the gallery). */
async function filteredImage(dataUrl: string, f: CamFilter) {
  if (!f.ops.length) return dataUrl;
  const img = await loadImage(dataUrl);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d')!.drawImage(img, 0, 0);
  applyFilter(c, f);
  return c.toDataURL('image/jpeg', 0.9);
}

const SHADOW = { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.35))' };

/** iOS-app camera chrome. Positions are measured from the reference screenshot (pt). */
function PhoneControls({
  live,
  flash,
  onFlip,
  onFlash,
  onShutter,
  onMemories,
  myAvatar,
  placeholder,
  filterIdx,
  onFilter,
}: {
  live: boolean;
  flash: boolean;
  onFlip: () => void;
  onFlash: () => void;
  onShutter: () => void;
  onMemories: () => void;
  myAvatar: string;
  placeholder: (title: string, text: string) => void;
  filterIdx: number;
  onFilter: (i: number) => void;
}) {
  const { setSheet } = useStore.getState();
  const [tab, setTab] = useState('Für dich');
  const lens = () => placeholder('Linsen', 'Gesichts-Linsen sind in dieser Simulation nicht enthalten. Farbfilter findest du rechts neben dem Auslöser.');
  const at = (x: number, y: number, size: number) => ({ left: x - size / 2, top: y - size / 2, width: size, height: size });
  const atB = (x: number, yFromBottom: number, size: number) => ({ left: x - size / 2, bottom: yFromBottom - size / 2, width: size, height: size });
  const icon = 'press absolute z-10 flex items-center justify-center';
  return (
    <>
      {/* top row (centre y = 25pt below the preview's top edge) */}
      <div className="absolute z-10 overflow-hidden rounded-full bg-black/25" style={at(27.5, 25, 39)}>
        <Avatar src={myAvatar} size={39} bg="transparent" />
      </div>
      <button aria-label="Suche" className={icon} style={{ ...at(76, 25, 34), ...SHADOW }} onClick={() => placeholder('Suche', 'Suche ist im Chat-Tab verfügbar.')}>
        <Search size={25} strokeWidth={2.4} />
      </button>
      <button aria-label="Benachrichtigungen" className={icon} style={{ ...at(268.6, 25, 34), ...SHADOW }} onClick={() => placeholder('Benachrichtigungen', 'Keine neuen Benachrichtigungen.')}>
        <Bell size={25} strokeWidth={2.2} />
      </button>
      <button aria-label="Freunde hinzufügen" className={icon} style={{ ...at(316.7, 25, 34), ...SHADOW }} onClick={() => setSheet('contacts')}>
        <AddFriendIcon size={26} white />
      </button>
      <button aria-label="Kamera wechseln" className={icon} style={{ ...at(364.8, 25, 34), ...SHADOW }} onClick={onFlip}>
        <Repeat size={25} strokeWidth={2.3} style={{ transform: 'rotate(90deg)' }} />
      </button>
      <button aria-label="Blitz" className={icon} style={{ ...at(364.8, 65, 34), ...SHADOW }} onClick={onFlash}>
        {flash ? <Zap size={25} fill="#FFFC00" color="#FFFC00" /> : <ZapOff size={25} strokeWidth={2.2} />}
      </button>
      <button aria-label="Musik" className={icon} style={{ ...at(364.8, 104.5, 34), ...SHADOW }} onClick={() => placeholder('Musik', 'Musik ist in dieser Simulation nicht enthalten.')}>
        <Music size={25} strokeWidth={2.2} />
      </button>
      <button aria-label="Video aufnehmen" className={icon} style={{ ...at(364.8, 144.5, 34), ...SHADOW }} onClick={() => placeholder('Video', 'Videoaufnahme ist nicht enthalten – tippe auf den Auslöser für ein Foto.')}>
        <CircleStop size={26} strokeWidth={2.2} />
      </button>
      <button aria-label="Mehr" className="press absolute z-10 flex items-center justify-center rounded-full bg-black/45" style={{ left: 364.8 - 16, top: 185 - 13, width: 32, height: 26 }} onClick={() => placeholder('Mehr Werkzeuge', 'Weitere Kamera-Werkzeuge sind nicht enthalten.')}>
        <ChevronDown size={20} strokeWidth={2.6} />
      </button>

      {/* bottom area (distances from the tab bar) */}
      <button aria-label="Vollbild" className="press absolute z-10 flex items-center justify-center rounded-full bg-black/40" style={atB(196.5, 167.5, 30)} onClick={() => placeholder('Vollbild', 'Die Vollbild-Kamera ist nicht enthalten.')}>
        <Maximize2 size={15} strokeWidth={2.6} />
      </button>
      <button aria-label="AI" className="press absolute z-10 flex flex-col items-center" style={{ left: 66 - 26, bottom: 64, width: 52, ...SHADOW }} onClick={() => placeholder('AI', 'KI-Linsen sind in dieser Simulation nicht enthalten.')}>
        <span className="relative text-[27px] font-semibold leading-[30px] tracking-[-1px]">
          Ai<Sparkles size={11} className="absolute -right-[7px] -top-[2px]" fill="#fff" />
        </span>
        <span className="mt-[3px] text-[13.5px] font-semibold leading-none">AI</span>
      </button>
      <button aria-label="Memorys" className="press absolute z-10 flex flex-col items-center" style={{ left: 119.6 - 34, bottom: 64, width: 68, ...SHADOW }} onClick={onMemories}>
        <span className="relative">
          <Images size={29} strokeWidth={2.1} />
          <span className="absolute -right-[4px] -top-[3px] h-[9px] w-[9px] rounded-full bg-[#F23C57]" />
        </span>
        <span className="mt-[3px] text-[13.5px] font-semibold leading-none">Memorys</span>
      </button>
      <button aria-label="Foto aufnehmen" data-testid="shutter" className="press absolute z-10 rounded-full border-[5px] border-white" style={atB(196.5, 97, 85)} onClick={onShutter} />
      {!live && <span className="sr-only">Kamera nicht aktiv – Auslöser öffnet den Upload</span>}
      {/* filter carousel right of the shutter (circles 49pt every 61.3pt, first centre at 273.7pt) */}
      <div
        className="scroll absolute z-10 flex items-center gap-[12.3px] overflow-x-auto"
        style={{ left: 249.2, right: 0, bottom: 97 - 30, height: 60, paddingRight: 12 }}
        data-testid="filters"
      >
        {FILTERS.map((f, i) => (
          <button
            key={f.id}
            aria-label={`Filter ${f.name}`}
            aria-pressed={i === filterIdx}
            className="press relative h-[49px] w-[49px] shrink-0 overflow-hidden rounded-full bg-[#333]"
            style={{ boxShadow: i === filterIdx ? '0 0 0 3px #fff' : '0 1px 3px rgba(0,0,0,.35)' }}
            onClick={() => onFilter(i === filterIdx ? 0 : i)}
          >
            <img src={myAvatar} alt="" className="h-full w-full object-cover" style={{ filter: cssFilter(f) }} draggable={false} />
            {f.id === 'none' && <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-[10px] font-bold">Aus</span>}
          </button>
        ))}
      </div>
      {filterIdx > 0 && (
        <div
          key={filterIdx}
          className="anim-pop pointer-events-none absolute z-10 rounded-full bg-black/35 px-3 py-[3px] text-[13px] font-semibold"
          style={{ left: '50%', transform: 'translateX(-50%)', bottom: 97 + 42.5 + 62 }}
        >
          {FILTERS[filterIdx].name}
        </div>
      )}

      {/* lens categories */}
      <button aria-label="Spiele" className={icon} style={{ ...atB(27.7, 30, 34), ...SHADOW }} onClick={() => placeholder('Spiele', 'Spiele sind in dieser Simulation nicht enthalten.')}>
        <Gamepad2 size={27} strokeWidth={2.1} />
      </button>
      {(
        [
          ['Favoriten', 116],
          ['Für dich', 196.5],
          ['Halloween', 281],
        ] as const
      ).map(([label, x]) => (
        <button
          key={label}
          className={`press absolute z-10 flex items-center justify-center rounded-full text-[14.5px] font-medium ${tab === label ? 'bg-black/35 text-white' : 'text-white/85'}`}
          style={{ left: x - 40, bottom: 30 - 16, width: 80, height: 32, textShadow: '0 1px 2px rgba(0,0,0,.35)' }}
          onClick={() => setTab(label)}
        >
          {label}
        </button>
      ))}
      <button aria-label="Linsen suchen" className={icon} style={{ ...atB(365, 30, 34), ...SHADOW }} onClick={lens}>
        <SmilePlus size={27} strokeWidth={2.1} />
      </button>
    </>
  );
}
