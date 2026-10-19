import { useMemo, useState } from 'react';
import { Clock, Cog, Images, Layers, Moon, Navigation, TrendingUp, Trophy, UserPlus, UserSearch } from 'lucide-react';
import { useStore } from '../store';
import { relTime } from '../utils';
import { Avatar } from './common';
import { Emo } from './Emoji';

// Dark "Snap Map" look of the iOS app, drawn offline. Nothing reads the real location unless the
// user taps the navigation button, and even then it stays on the device.
// Positions in pt, measured from the reference screenshot (393×852).

// deterministic pseudo-random generator so the map looks the same every visit
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function MapArt() {
  const blocks = useMemo(() => {
    const r = rng(7);
    const out: string[] = [];
    for (let i = 0; i < 70; i++) {
      const x = r() * 420 - 20, y = r() * 880 - 20, w = 30 + r() * 70, h = 25 + r() * 60, a = (r() - 0.5) * 40;
      out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" transform="rotate(${a} ${x + w / 2} ${y + h / 2})" />`);
    }
    return out.join('');
  }, []);
  const streets = useMemo(() => {
    const r = rng(42);
    const out: string[] = [];
    for (let i = 0; i < 46; i++) {
      const x1 = r() * 440 - 20, y1 = r() * 900 - 20, len = 120 + r() * 260, a = r() * Math.PI;
      out.push(`<path d="M${x1} ${y1} L${x1 + Math.cos(a) * len} ${y1 + Math.sin(a) * len}" />`);
    }
    return out.join('');
  }, []);
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 393 852" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="393" height="852" fill="#29343f" />
      <g fill="#263042" dangerouslySetInnerHTML={{ __html: blocks }} />
      <path d="M250 300 l90 -20 l40 60 l-70 40 Z M20 420 l70 -10 l20 50 l-80 20 Z" fill="#363d4d" />
      <g stroke="#3a4558" strokeWidth="1.6" fill="none" dangerouslySetInnerHTML={{ __html: streets }} />
      {/* waterways and the big roads are black, as in the app */}
      <g stroke="#040404" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-10 280 C 60 250 120 230 190 225 S 300 200 410 150" strokeWidth="13" />
        <path d="M-10 640 C 60 610 110 560 150 500 S 210 380 175 330 S 140 260 170 230" strokeWidth="7" />
        <path d="M175 330 C 230 350 260 420 300 470 S 360 560 410 540" strokeWidth="9" />
        <path d="M120 120 L 150 210 L 140 300 L 160 420 L 150 480" strokeWidth="4" />
        <path d="M300 470 C 330 520 360 600 410 620" strokeWidth="5" />
        <path d="M-10 160 L 80 175 L 150 150 L 260 165" strokeWidth="5" />
      </g>
      <path d="M-20 290 L 40 270 L 60 330 L -20 360 Z" fill="#040404" />
    </svg>
  );
}

const POIS: { x: number; y: number; icon: string; name: string; sub?: string; photo?: boolean }[] = [
  { x: 52, y: 378, icon: '🍸', name: 'Shisha-Bar' },
  { x: 98, y: 448, icon: '🥙', name: 'Döner-Imbiss', sub: 'Top-Besucher', photo: true },
  { x: 230, y: 497, icon: '🎓', name: 'Universität' },
  { x: 74, y: 572, icon: '🍗', name: 'Chicken Grill', sub: 'Top-Besucher', photo: true },
  { x: 214, y: 640, icon: '☕', name: 'Café am Platz', sub: 'Top-Besucher', photo: true },
  { x: 60, y: 648, icon: '🍴', name: 'Sozialer Hotspot' },
];

export default function MapScreen() {
  const contacts = useStore((s) => s.contacts);
  const settings = useStore((s) => s.settings);
  const { openChat, setScreen, showPlaceholder, setSheet, showToast } = useStore.getState();
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);

  const locate = () => {
    if (!navigator.geolocation) return showToast('Standort wird nicht unterstützt.');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lon: p.coords.longitude });
        showToast(`Standort ${p.coords.latitude.toFixed(2)}, ${p.coords.longitude.toFixed(2)} – nur lokal`);
      },
      () => showToast('Standortzugriff nicht erlaubt.'),
      { timeout: 10000 },
    );
  };

  // friends shown on the map: contacts with a friend emoji, at fixed spots
  const spots = [
    { x: 300, y: 300 },
    { x: 300, y: 405 },
    { x: 80, y: 250 },
  ];
  const friends = contacts.slice(0, 3);
  const chip = 'press flex h-[27px] shrink-0 items-center gap-[6px] rounded-full bg-[#1e1e1e]/95 px-[10px] text-[14px] font-medium';
  const round = 'press absolute flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#1e1e1e]';

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#29343f]" data-testid="map">
      <MapArt />

      {POIS.map((p) => (
        <button
          key={p.name}
          className="press absolute flex items-center gap-[6px] text-left"
          style={{ left: p.x - 18, top: p.y - 18 }}
          onClick={() => showPlaceholder(p.name, 'Orte sind in dieser Simulation nur Dekoration.')}
        >
          <span
            className={`flex items-center justify-center rounded-full ${p.photo ? 'h-[36px] w-[36px] border-2 border-[#c799e8] bg-[#3b3f52] text-[18px]' : 'h-[20px] w-[20px] bg-white text-[11px]'}`}
          >
            <Emo text={p.icon} />
          </span>
          <span className="leading-[15px]" style={{ textShadow: '0 0 3px #000, 0 0 2px #000' }}>
            <span className="block text-[13px] font-semibold text-white">{p.name}</span>
            {p.sub && <span className="block text-[11px] font-semibold text-[#c799e8]">{p.sub}</span>}
          </span>
        </button>
      ))}

      {friends.map((c, i) => (
        <button
          key={c.id}
          className="press absolute flex -translate-x-1/2 flex-col items-center"
          style={{ left: spots[i].x, top: spots[i].y }}
          onClick={() => {
            setScreen('chat');
            openChat(c.id);
          }}
        >
          <Avatar src={c.avatar} size={44} />
          <span className="mt-[3px] flex items-center gap-[4px] whitespace-nowrap rounded-[6px] bg-[#1e1e1e]/95 px-[6px] py-[2px] text-[12px] font-bold">
            {c.friendEmoji && <Emo text={c.friendEmoji} />}
            <Emo text={c.name.split(/\s/)[0]} />
            <span className="font-medium text-[#9a9a9a]">{relTime(c.lastInteraction).replace(' Min.', 'min')}</span>
          </span>
        </button>
      ))}

      {/* me */}
      <div className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: 196, top: 300 }}>
        <div className="rounded-full bg-[#0EADFF] p-[3px] shadow-lg">
          <Avatar src={settings.myAvatar} size={46} />
        </div>
        <div className="h-[34px] w-[3px] bg-gradient-to-b from-[#0EADFF] to-transparent" />
        <span className="flex items-center gap-[5px] rounded-[6px] bg-[#1e1e1e]/95 px-[7px] py-[3px] text-[13px] font-bold">
          Ich
          <span className="relative inline-block h-[10px] w-[19px] rounded-[3px] border-[1.6px] border-[#F23C57]">
            <span className="absolute inset-y-[1px] left-[1px] w-[4px] rounded-[1px] bg-[#F23C57]" />
          </span>
          <span className="font-semibold text-[#34C759]">{me ? 'jetzt' : 'eben'}</span>
        </span>
      </div>

      {/* top */}
      <div className="absolute overflow-hidden rounded-full bg-black/30" style={{ left: 8, top: 'calc(var(--top) + 5px)', width: 39, height: 39 }}>
        <Avatar src={settings.myAvatar} size={39} bg="transparent" />
      </div>
      <div className="absolute right-[54px] flex flex-col items-end" style={{ top: 'calc(var(--top) + 3px)', textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
        <span className="max-w-[260px] truncate text-[23px] font-bold leading-[30px]">{settings.mapTitle}</span>
        <span className="flex items-center gap-[4px] text-[14px] font-semibold">
          <Moon size={14} fill="#fff" /> {settings.mapWeather}
        </span>
      </div>
      <button
        aria-label="Orte"
        className="press absolute flex items-center justify-center overflow-hidden rounded-full border-[2px] border-[#0EADFF] bg-[#3b3f52]"
        style={{ left: 363 - 19, top: 'calc(var(--top) + 11px)', width: 38, height: 38 }}
        onClick={() => showPlaceholder('Orte', 'Orte sind in dieser Simulation nur Dekoration.')}
      >
        <Emo text="🏙️" />
      </button>
      <div className="scroll absolute inset-x-0 flex gap-[8px] overflow-x-auto px-[8.5px]" style={{ top: 'calc(var(--top) + 64px)' }}>
        <button className={chip} onClick={() => setScreen('stories')}>
          <Images size={15} /> Memorys
        </button>
        <button className={chip} onClick={() => showPlaceholder('Meistbesucht', 'Nicht enthalten.')}>
          <Trophy size={15} /> Meistbesucht
        </button>
        <button className={chip} onClick={() => showPlaceholder('Im Trend', 'Nicht enthalten.')}>
          <TrendingUp size={15} /> Im Trend
        </button>
        <button className={chip} onClick={() => showPlaceholder('Besucht', 'Nicht enthalten.')}>
          <Clock size={15} /> Besucht
        </button>
      </div>

      {/* right controls */}
      <button aria-label="Karten-Einstellungen" className={round} style={{ left: 363 - 19, bottom: 'calc(var(--nav) + 162px)' }} onClick={() => showPlaceholder('Geistmodus', 'Geistmodus ist aktiv – in der Simulation wird kein Standort geteilt.')}>
        <Cog size={21} />
      </button>
      <button aria-label="Ebenen" className={round} style={{ left: 363 - 19, bottom: 'calc(var(--nav) + 115px)' }} onClick={() => showPlaceholder('Ebenen', 'Kartenebenen sind nicht enthalten.')}>
        <Layers size={21} />
      </button>
      <button aria-label="Meinen Standort anzeigen" className={round} style={{ left: 363 - 19, bottom: 'calc(var(--nav) + 67px)' }} onClick={locate}>
        <Navigation size={19} style={{ transform: 'rotate(0deg)' }} />
      </button>

      {/* bottom row */}
      <button aria-label="Freunde suchen" className="press absolute flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#1e1e1e]" style={{ left: 9, bottom: 'calc(var(--nav) + 12px)' }} onClick={() => setSheet('contacts')}>
        <UserSearch size={22} />
      </button>
      <button aria-label="Freund" className="press absolute overflow-hidden rounded-full bg-[#1e1e1e]" style={{ left: 62, bottom: 'calc(var(--nav) + 12px)', width: 42, height: 42 }} onClick={() => contacts[0] && (setScreen('chat'), openChat(contacts[0].id))}>
        <Avatar src={contacts[0]?.avatar} size={42} />
      </button>
      <button
        className="press absolute flex h-[42px] items-center justify-center gap-[8px] rounded-full bg-[#1e1e1e] text-[17px] font-semibold"
        style={{ left: 116, width: 174, bottom: 'calc(var(--nav) + 12px)' }}
        onClick={() => setSheet('contacts')}
      >
        <UserPlus size={21} /> Freunde adden
      </button>
    </div>
  );
}
