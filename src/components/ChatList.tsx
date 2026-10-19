import { useEffect, useMemo, useState } from 'react';
import { Emo } from './Emoji';
import { Bell, Search, X } from 'lucide-react';
import { useStore } from '../store';
import type { Contact } from '../types';
import { relTime, STATUS_INFO } from '../utils';
import { AddFriendIcon, COLORS, ComposeIcon, SentArrow, SnapCamIcon, StarBadge, StatusSquare } from './icons';
import { Avatar, useLongPress } from './common';

/** Header shared by the Chat / Stories / Map screens (avatar, search, title, bell, add-friend, menu). */
/** plainAdd: grey add-friend button without badge (as on the Storys tab). */
export function TopHeader({ title, plainAdd }: { title: string; plainAdd?: boolean }) {
  const settings = useStore((s) => s.settings);
  const setSheet = useStore((s) => s.setSheet);
  const showPlaceholder = useStore((s) => s.showPlaceholder);
  const [searching, setSearching] = useState(false);
  return (
    <>
      <div className="relative h-[50px] shrink-0">
        <button
          aria-label="Profil"
          className="press absolute left-[8px] top-[5px] h-[40px] w-[40px] overflow-hidden rounded-full bg-[#2a2a2a]"
          onClick={() => showPlaceholder('Profil', 'Das Profil ist in dieser Simulation nicht nachgebaut. Dein Avatar lässt sich unter ••• → Statusleiste & Profil ändern.')}
        >
          <Avatar src={settings.myAvatar} size={40} />
        </button>
        <button
          aria-label="Suche"
          className="press absolute left-[56px] top-[5px] flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#2a2a2a]"
          onClick={() => setSearching(true)}
        >
          <Search size={21} strokeWidth={2.2} color="#fff" />
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-[9px] text-center text-[18.5px] font-semibold leading-[32px] tracking-[0px] text-[#D4D4D4]">
          {title}
        </div>
        <button
          aria-label="Benachrichtigungen"
          className="press absolute left-[248px] top-[5px] flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#2a2a2a]"
          onClick={() => showPlaceholder('Benachrichtigungen', 'Keine neuen Benachrichtigungen. (Simulation – es gibt keine Verbindung zu echten Konten.)')}
        >
          <Bell size={21} strokeWidth={2} color="#fff" />
        </button>
        <button
          aria-label="Freunde hinzufügen"
          className={`press absolute left-[296px] top-[5px] flex h-[40px] w-[40px] items-center justify-center rounded-full ${plainAdd ? 'bg-[#2b2b2b]' : 'bg-[#FFFC00]'}`}
          onClick={() => setSheet('contacts')}
        >
          <AddFriendIcon size={23} white={plainAdd} />
          {!plainAdd && settings.addFriendBadge > 0 && (
            <span className="absolute -right-[4px] -top-[6px] flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-[#F23C57] px-[4px] text-[12px] font-semibold leading-none text-white">
              {settings.addFriendBadge}
            </span>
          )}
        </button>
        <button
          aria-label="Menü"
          className="press absolute left-[344px] top-[5px] flex h-[40px] w-[40px] items-center justify-center gap-[3.5px] rounded-full bg-[#2a2a2a]"
          onClick={() => setSheet('menu')}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[5px] w-[5px] rounded-full bg-white" />
          ))}
        </button>
      </div>
      {searching && <SearchOverlay onClose={() => setSearching(false)} />}
    </>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const contacts = useStore((s) => s.contacts);
  const openChat = useStore((s) => s.openChat);
  const [q, setQ] = useState('');
  const list = contacts.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="anim-fade absolute inset-0 z-50 flex flex-col bg-[#121212] pt-[var(--top)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#2a2a2a] px-3">
          <Search size={18} color="#999" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suchen"
            className="h-[40px] flex-1 bg-transparent text-white outline-none placeholder:text-[#888]"
          />
        </div>
        <button className="press px-2 text-[15px] font-semibold" onClick={onClose}>
          Abbrechen
        </button>
      </div>
      <div className="scroll flex-1">
        {list.map((c) => (
          <button
            key={c.id}
            className="row-press flex w-full items-center gap-3 px-4 py-2 text-left"
            onClick={() => {
              onClose();
              openChat(c.id);
            }}
          >
            <Avatar src={c.avatar} size={40} />
            <span className="text-[16px] font-medium"><Emo text={c.name} /></span>
          </button>
        ))}
        {!list.length && <div className="p-6 text-center text-[#888]">Keine Treffer</div>}
      </div>
      <button aria-label="Suche schließen" className="hidden" onClick={onClose}>
        <X />
      </button>
    </div>
  );
}

function Tabs() {
  const settings = useStore((s) => s.settings);
  const showPlaceholder = useStore((s) => s.showPlaceholder);
  const tab = (label: string, text: string) => () => showPlaceholder(label, text);
  return (
    <div className="scroll flex h-[40px] shrink-0 items-center gap-[17px] overflow-x-auto overflow-y-hidden whitespace-nowrap pl-[20px] pr-4 pt-[3px] text-[13.5px] font-semibold tracking-[0px] text-white">
      <button className="press flex shrink-0 items-center gap-[6px]" onClick={tab('My AI', 'Ein KI-Chat ist in dieser Offline-Simulation nicht enthalten.')}>
        <Avatar src="avatars/myai.png" size={20} />
        My AI
      </button>
      <button className="press shrink-0" onClick={tab('In meiner Nähe', 'Diese Simulation nutzt keinen echten Standort und zeigt keine Personen in der Nähe.')}>
        In meiner Nähe
      </button>
      <button className="press shrink-0" onClick={tab('Gruppen', 'Gruppenchats sind in dieser Simulation noch nicht umgesetzt.')}>
        Gruppen
      </button>
      <button className="press flex shrink-0 items-center gap-[5px]" onClick={tab('Flashbacks', 'Flashbacks sind ein Platzhalter. Deine gespeicherten Snaps findest du in den Chats.')}>
        Flashbacks
        {settings.flashbacksBadge > 0 && (
          <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-white px-1 text-[12px] font-bold leading-none text-black">
            {settings.flashbacksBadge}
          </span>
        )}
      </button>
    </div>
  );
}

export function StatusIcon({ c, size = 1 }: { c: Contact; size?: number }) {
  const info = STATUS_INFO[c.status];
  if (info.shape === 'none') return null;
  const color = COLORS[info.color];
  return info.shape === 'arrow' ? (
    <SentArrow color={color} filled={info.filled} size={14 * size} />
  ) : (
    <StatusSquare color={color} filled={info.filled} size={12.5 * size} bubble={info.color === 'blue'} />
  );
}

export function ContactRow({ c, now }: { c: Contact; now: number }) {
  const openChat = useStore((s) => s.openChat);
  const openSnap = useStore((s) => s.openSnap);
  const openCamera = useStore((s) => s.openCamera);
  const setEditContact = useStore((s) => s.setEditContact);
  const setSheet = useStore((s) => s.setSheet);
  const info = STATUS_INFO[c.status];
  const time = c.timeMode === 'auto' ? relTime(c.lastInteraction, now) : c.timeLabel;
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
  const emojiOnlyName = /^\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*$/u.test(c.name.trim());

  return (
    <div className="row-press relative flex h-[60.5px] items-center" data-testid="contact-row" {...press}>
      <div className="relative ml-[10px] h-[46px] w-[46px] shrink-0">
        <Avatar src={c.avatar} size={46} ring={c.storyRing} />
        {c.friendEmoji && (
          <div className="absolute left-[-2px] top-[28px] flex h-[19px] w-[19px] items-center justify-center rounded-full bg-[#121212] text-[13px] leading-none">
            <Emo text={c.friendEmoji} />
          </div>
        )}
      </div>
      <div className="ml-[11px] min-w-0 flex-1 pr-[70px] pt-[3px]">
        <div className="flex items-center gap-[5px] truncate text-[17px] font-normal leading-[23px] tracking-[0px] text-white">
          <span className={`truncate ${emojiOnlyName ? 'text-[21px]' : ''}`}><Emo text={c.name} /></span>
          {c.nameBadge === 'star' && <StarBadge size={16} />}
        </div>
        <div className="flex items-center whitespace-nowrap text-[12.5px] leading-[18px] text-[#A3A3A3]">
          <span className="mr-[6px] flex w-[13px] shrink-0 items-center justify-center">
            <StatusIcon c={c} />
          </span>
          <span className={info.bold ? 'font-semibold' : ''} style={info.bold ? { color: COLORS[info.color] } : undefined}>
            {info.label}
          </span>
          {time && (
            <>
              <span className="mx-[6px]">·</span>
              <span>{time}</span>
            </>
          )}
          {c.showStreak && c.streak > 0 && (
            <>
              <span className="mx-[6px]">·</span>
              <span className="text-white">{c.streak}</span>
              <span className="text-[12px] leading-none"><Emo text="🔥" /></span>
              {c.hourglass && <span className="ml-[2px] text-[14px] leading-none"><Emo text="⏳" /></span>}
            </>
          )}
        </div>
      </div>
      {c.pinned && <div className="absolute right-[75px] top-1/2 -translate-y-1/2 text-[17px] leading-none"><Emo text="📌" /></div>}
      <button
        aria-label={`Snap an ${c.name}`}
        className="press absolute right-[15px] top-1/2 -translate-y-1/2 p-1"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          openCamera(c.id);
        }}
      >
        <SnapCamIcon size={24} />
      </button>
    </div>
  );
}

export default function ChatList() {
  const contacts = useStore((s) => s.contacts);
  const showPlaceholder = useStore((s) => s.showPlaceholder);
  const setSheet = useStore((s) => s.setSheet);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  // Pinned contacts float to the top; everything else keeps the user's order.
  const ordered = useMemo(() => [...contacts.filter((c) => c.pinned), ...contacts.filter((c) => !c.pinned)], [contacts]);

  return (
    <div className="absolute inset-0 flex flex-col pt-[var(--top)]">
      <TopHeader title="Chat" />
      <Tabs />
      <div className="scroll relative min-h-0 flex-1 pb-[110px] pt-[0.5px]" data-testid="chat-list">
        {ordered.map((c) => (
          <ContactRow key={c.id} c={c} now={now} />
        ))}
        {!ordered.length && (
          <div className="px-8 pt-16 text-center text-[#888]">
            Noch keine Kontakte.
            <button className="mt-4 block w-full text-[#0EADFF]" onClick={() => setSheet('contacts')}>
              Kontakt hinzufügen
            </button>
          </div>
        )}
      </div>
      <button
        aria-label="Neuer Chat"
        className="press absolute right-[16px] z-10 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#FFFC00] shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
        style={{ bottom: 'calc(var(--nav) + 15px)' }}
        onClick={() => showPlaceholder('Neuer Chat', 'Tippe auf einen Kontakt, um den Chat zu öffnen. Neue Kontakte legst du über ••• → Kontakte bearbeiten an.')}
      >
        <ComposeIcon size={31} />
      </button>
    </div>
  );
}
