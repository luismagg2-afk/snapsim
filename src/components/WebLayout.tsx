// Snapchat-Web style desktop layout: contact sidebar on the left, rounded content panel on the right.
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Ghost, Search, Settings as Gear, Users, X } from 'lucide-react';
import { useStore } from '../store';
import type { Contact } from '../types';
import { relTimeWeb, STATUS_INFO, webLabel } from '../utils';
import { Avatar, useLongPress } from './common';
import { Emo } from './Emoji';
import { AddFriendIcon, COLORS, SnapCamIcon, StarBadge } from './icons';
import { StatusIcon } from './ChatList';
import ChatView from './ChatView';
import CameraScreen from './Camera';
import StoriesScreen from './Stories';
import SpotlightScreen from './Spotlight';
import MapScreen from './MapScreen';
import { SnapViewer, StoryViewer } from './Viewers';

// Built-in background: the panel from the user's Snapchat Web screenshot (forest + Bitmoji),
// made by scripts/make-web-bg.mjs. Card and friends-tab positions are measured from the same
// screenshot, as fractions of the panel, so they line up with the image at any window size.
const BUILTIN_BG = 'web-bg.webp';
const CARD = { left: '23.27%', top: '10.39%', width: '32.6%', height: '79.22%' };
const STAGE_RATIO = 1500 / 1097;
const FRIENDS_TAB = { right: 0, top: '45.58%', width: '6.4%', height: '8.75%' };

export default function WebLayout() {
  const contacts = useStore((s) => s.contacts);
  const settings = useStore((s) => s.settings);
  const screen = useStore((s) => s.screen);
  const openChatId = useStore((s) => s.openChatId);
  const snapView = useStore((s) => s.snapView);
  const storyView = useStore((s) => s.storyView);
  const { setSheet, showPlaceholder, updateSettings, openChat, setScreen } = useStore.getState();
  const [q, setQ] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (useStore.getState().openChatId) openChat(null);
      else if (useStore.getState().screen !== 'chat') setScreen('chat');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openChat, setScreen]);

  const ordered = useMemo(() => {
    const list = [...contacts.filter((c) => c.pinned), ...contacts.filter((c) => !c.pinned)];
    return q ? list.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())) : list;
  }, [contacts, q]);

  const inPanel = screen !== 'chat';

  return (
    <div className="absolute inset-0 flex bg-[#111111]" data-testid="web-layout">
      {/* sidebar */}
      <aside className="web-sidebar flex shrink-0 flex-col bg-[#111111]">
        <div className="relative flex h-[62px] shrink-0 items-center px-[12px]">
          <button aria-label="Simulator-Menü" className="press relative h-[38px] w-[38px]" onClick={() => setSheet('menu')}>
            <Avatar src={settings.myAvatar} size={38} />
            <span className="absolute -bottom-[2px] -right-[3px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-[#2a2a2a] ring-2 ring-[#111]">
              <Gear size={10} strokeWidth={2.6} />
            </span>
          </button>
          <button
            aria-label="Snapchat"
            className="press absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            onClick={() => setScreen('spotlight')}
          >
            <Ghost size={30} strokeWidth={1.8} />
          </button>
          <div className="ml-auto flex gap-[9px]">
            <button aria-label="Freunde hinzufügen" className="press flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#2a2a2a]" onClick={() => setSheet('contacts')}>
              <AddFriendIcon size={21} white />
            </button>
            <button
              aria-label="Neuer Chat"
              className="press flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#0FADFC]"
              onClick={() => showPlaceholder('Neuer Chat', 'Wähle links einen Kontakt, um zu chatten.')}
            >
              <NewChatIcon />
            </button>
          </div>
        </div>

        {settings.webBanner && (
          <div className="relative flex shrink-0 items-center gap-3 bg-[#0FADFC] py-[12px] pl-[12px] pr-[36px]">
            <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[11px] bg-[#FFFC00]">
              <Ghost size={26} color="#000" fill="#fff" strokeWidth={2} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[15.5px] font-bold underline">Klicke, um die Desktop-App zu installieren</div>
              <div className="mt-[3px] text-[12px] font-semibold">um immer auf deine Chats zugreifen zu können!</div>
            </div>
            <button aria-label="Banner schließen" className="press absolute right-[14px] top-1/2 -translate-y-1/2" onClick={() => updateSettings({ webBanner: false })}>
              <X size={17} strokeWidth={3} />
            </button>
          </div>
        )}

        <div className="shrink-0 px-[12px] py-[12px]">
          <div className="flex h-[36px] items-center gap-2 rounded-full bg-[#2a2a2a] pl-[10px] pr-[4px]">
            <Search size={17} color="#bbb" strokeWidth={2.4} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suchen"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-[#bdbdbd]"
            />
            <button
              className="press flex h-[28px] items-center gap-1 rounded-full bg-[#121212] pl-[8px] pr-[4px] text-[13px] font-bold"
              onClick={() => showPlaceholder('My AI', 'Ein KI-Chat ist in dieser Offline-Simulation nicht enthalten.')}
            >
              My AI <Avatar src="avatars/myai.png" size={20} /> <ChevronRight size={15} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="scroll min-h-0 flex-1" data-testid="web-list">
          {ordered.map((c) => (
            <WebRow key={c.id} c={c} now={now} active={openChatId === c.id} />
          ))}
        </div>
      </aside>

      {/* content panel */}
      <main className="relative min-w-0 flex-1 p-[10px] pl-[10px]">
        <div
          className="relative h-full w-full overflow-hidden rounded-[20px] bg-black"
          style={{ ['--top' as string]: '0px', ['--nav' as string]: '0px', ['--sab' as string]: '0px', containerType: 'size' }}
        >
          {/* Stage keeps the screenshot's aspect ratio and covers the panel (anchored right, so the
              friends tab stays on the edge); card and tab are positioned inside it. */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2"
            style={{ width: `max(100cqw, calc(100cqh * ${STAGE_RATIO}))`, aspectRatio: String(STAGE_RATIO) }}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundImage: `url(${settings.webBackground || BUILTIN_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            {!openChatId && !inPanel && <CameraCard builtin={!settings.webBackground} />}

          {/* like Snapchat Web: the camera lives in the centre card, background stays visible */}
          {screen === 'camera' && !openChatId && (
            <div
              className="anim-pop absolute z-10 overflow-hidden rounded-[12px] bg-[#1b1b1b]"
              style={CARD}
              data-testid="web-camera-card"
            >
              <CameraScreen web onClose={() => setScreen('chat')} />
            </div>
          )}
          </div>

          {inPanel && screen !== 'camera' && !openChatId && (
            <div className="absolute inset-0 z-10 bg-[#121212]">
              {screen === 'stories' && <StoriesScreen />}
              {screen === 'spotlight' && <SpotlightScreen />}
              {screen === 'map' && <MapScreen />}
              <button aria-label="Schließen" className="no-export press absolute right-3 top-3 z-50 rounded-full bg-black/50 p-2" onClick={() => setScreen('chat')}>
                <X size={20} />
              </button>
            </div>
          )}
          {openChatId && (
            <div className="absolute inset-0 z-10 bg-[#121212]">
              <ChatView key={openChatId} contactId={openChatId} />
            </div>
          )}
          {snapView && <SnapViewer />}
          {storyView && <StoryViewer />}
        </div>
      </main>
    </div>
  );
}

function CameraCard({ builtin }: { builtin: boolean }) {
  const { setScreen } = useStore.getState();
  // Sizes are fractions of the card (container query units), measured from Snapchat Web.
  return (
    <>
      <div
        className={`absolute overflow-hidden rounded-[12px] ${builtin ? '' : 'bg-[rgba(120,128,20,0.62)] backdrop-blur-[18px]'}`}
        style={{ ...CARD, containerType: 'size' }}
      >
        <button
          aria-label="Kamera öffnen"
          data-testid="web-camera"
          className="press absolute left-1/2 flex aspect-square w-[61.9cqw] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/[0.18]"
          style={{ top: '41.9%' }}
          onClick={() => setScreen('camera')}
        >
          <SnapCamIcon size={0} color="#fff" filled style={{ width: '54.6%', height: 'auto' }} />
        </button>
        <div
          className="absolute inset-x-0 text-center font-bold text-white/95"
          style={{ top: '65.6%', fontSize: '5.5cqw', lineHeight: 1.18 }}
        >
          Klicke auf die Kamera,
          <br />
          um Snaps zu senden
        </div>
      </div>
      <button
        aria-label="Stories"
        className={`press absolute z-[5] flex items-center justify-center rounded-l-[14px] ${builtin ? '' : 'bg-white/20 backdrop-blur-md'}`}
        style={FRIENDS_TAB}
        onClick={() => setScreen('stories')}
      >
        {!builtin && <Users size={24} />}
      </button>
    </>
  );
}

function WebRow({ c, now, active }: { c: Contact; now: number; active: boolean }) {
  const { openChat, openSnap, openCamera, setEditContact, setSheet } = useStore.getState();
  const info = STATUS_INFO[c.status];
  const time = c.timeMode === 'auto' ? relTimeWeb(c.lastInteraction, now) : webLabel(c.timeLabel);
  const reply = c.status === 'received_snap' || c.status === 'received_video' || c.status === 'new_snap' || c.status === 'new_video';
  const press = useLongPress(
    () => {
      setEditContact(c.id);
      setSheet('contacts');
    },
    () => {
      if ((c.status === 'new_snap' || c.status === 'new_video') && openSnap(c.id)) return;
      openChat(c.id);
    },
  );
  return (
    <div
      {...press}
      data-testid="contact-row"
      className={`relative flex h-[74px] cursor-pointer items-center border-b border-[#363636] transition-colors ${active ? 'bg-[#2c2c2c]' : 'bg-[#1e1e1e] hover:bg-[#262626]'}`}
    >
      <div className="relative ml-[15px] h-[52px] w-[52px] shrink-0">
        <Avatar src={c.avatar} size={52} ring={c.storyRing} />
        {c.friendEmoji && (
          <div className="absolute -left-[3px] top-[33px] flex h-[19px] w-[19px] items-center justify-center rounded-full bg-[#1e1e1e] text-[13px] leading-none">
            <Emo text={c.friendEmoji} />
          </div>
        )}
        {c.pinned && (
          <div className="absolute -right-[2px] top-[34px] text-[11px] leading-none">
            <Emo text="📌" />
          </div>
        )}
      </div>
      <div className="ml-[14px] min-w-0 flex-1 pr-[72px]">
        <div className="flex items-center gap-[4px] truncate text-[16px] font-semibold leading-[21px] tracking-[-0.2px]">
          <span className="truncate">
            <Emo text={c.name} />
          </span>
          {c.nameBadge === 'star' && <StarBadge size={17} />}
        </div>
        <div className="mt-[3px] flex items-center whitespace-nowrap text-[13px] font-medium leading-[17px] text-[#bdbdbd]">
          <span className="mr-[5px] flex w-[14px] shrink-0 items-center justify-center">
            <StatusIcon c={c} size={0.85} />
          </span>
          <span className={info.bold ? 'font-bold' : ''} style={info.bold ? { color: COLORS[info.color] } : undefined}>
            {info.label}
          </span>
          {time && <span className="mx-[5px]">·</span>}
          {time && <span>{time}</span>}
          {c.showStreak && c.streak > 0 && (
            <>
              <span className="mx-[5px]">·</span>
              <span>{c.streak}</span>
              <span className="ml-[3px] text-[12px]">
                <Emo text="🔥" />
              </span>
              {c.hourglass && (
                <span className="ml-[2px] text-[12px]">
                  <Emo text="⏳" />
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <button
        aria-label={`Snap an ${c.name}`}
        className="press absolute right-[10px] top-1/2 flex w-[60px] -translate-y-1/2 flex-col items-center"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          openCamera(c.id);
        }}
      >
        {reply ? (
          <>
            <SnapCamIcon size={22} color="#fff" filled />
            <span className="mt-[3px] text-[10px] font-bold">Antworten</span>
          </>
        ) : (
          <SnapCamIcon size={19} color="#bdbdbd" />
        )}
      </button>
    </div>
  );
}

function NewChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M11 4H6.5A2.5 2.5 0 0 0 4 6.5v9A2.5 2.5 0 0 0 6.5 18H8v3l3.6-3h5.9a2.5 2.5 0 0 0 2.5-2.5V13" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M17 3v7M13.5 6.5h7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
