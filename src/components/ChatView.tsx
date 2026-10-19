import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Emo } from './Emoji';
import { ChevronLeft, Image as ImageIcon, Phone, Send, Smile, Video, X } from 'lucide-react';
import { useStore } from '../store';
import type { Message } from '../types';
import { clockTime, compressImage, dayLabel, pickFile } from '../utils';
import { exportScreen } from '../export';
import { Avatar, Sheet, Toggle, useLongPress } from './common';
import { COLORS, SentArrow, SnapCamIcon, StatusSquare } from './icons';

const EMOJIS = '😂🤣😭😍🥰😘😊😁😅😎🤔🙄😳🥺😴😤😡🤯🥲😇🤪😏😬🫶🏽❤️🧡💛💚💙💜🖤🤍💕💯🔥✨⭐🎉👍👎👏🙏💪👀🙈🤝✌️🤙👋🍕🍔🍟🍻⚽🎮🎧📸🚗✈️🏖️🌙☀️🌈'.match(
  /\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*/gu,
)!;

/** Keeps the chat sized to the visible area while the iOS keyboard is open. */
function useViewportHeight() {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const keyboardOpen = window.innerHeight - vv.height > 120;
      setH(keyboardOpen ? vv.height : null);
      if (keyboardOpen) window.scrollTo(0, 0);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return h;
}

export default function ChatView({ contactId }: { contactId: string }) {
  const contact = useStore((s) => s.contacts.find((c) => c.id === contactId));
  const messages = useStore((s) => s.messages[contactId]) ?? [];
  const typing = useStore((s) => s.typing[contactId]);
  const myName = useStore((s) => s.settings.myName);
  const { openChat, sendMessage, openCamera, showPlaceholder, openSnap } = useStore.getState();
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(false);
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const [options, setOptions] = useState(false);
  const [showTime, setShowTime] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const vh = useViewportHeight();

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, typing, vh]);

  if (!contact) return null;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(contactId, { text: t });
    setText('');
    inputRef.current?.focus();
  };

  const attach = async () => {
    const f = await pickFile('image/*');
    if (!f) return;
    sendMessage(contactId, { image: await compressImage(f) });
  };

  // Group consecutive messages by sender, with day separators.
  const blocks: { day?: string; from: 'me' | 'them'; items: Message[] }[] = [];
  let lastDay = '';
  for (const m of messages) {
    const d = dayLabel(m.createdAt);
    const prev = blocks[blocks.length - 1];
    if (d !== lastDay) {
      blocks.push({ day: d, from: m.from, items: [m] });
      lastDay = d;
    } else if (prev && prev.from === m.from) prev.items.push(m);
    else blocks.push({ from: m.from, items: [m] });
  }
  const lastMine = [...messages].reverse().find((m) => m.from === 'me');
  const lastIsMine = messages[messages.length - 1]?.from === 'me';

  return (
    <div
      className="anim-right absolute inset-x-0 top-0 z-40 flex flex-col bg-[#121212]"
      style={{ height: vh ?? '100%' }}
      data-testid="chat-view"
    >
      {/* header */}
      <div className="shrink-0 bg-[#121212] pt-[var(--top)]">
        <div className="flex h-[56px] items-center gap-2 pl-1 pr-3">
          <button aria-label="Zurück" className="press flex h-10 w-9 items-center justify-center" onClick={() => openChat(null)}>
            <ChevronLeft size={30} strokeWidth={2.4} />
          </button>
          <button className="press flex min-w-0 flex-1 items-center gap-2.5 text-left" onClick={() => setOptions(true)}>
            <Avatar src={contact.avatar} size={38} ring={contact.storyRing} />
            <div className="min-w-0">
              <div className="truncate text-[17px] font-bold leading-tight"><Emo text={contact.name} /></div>
              <div className="truncate text-[12.5px] text-[#A6A6A6]">
                <Emo text={typing ? 'schreibt …' : contact.showStreak && contact.streak > 0 ? `${contact.streak}🔥` : contact.friendEmoji || ' '} />
              </div>
            </div>
          </button>
          <button
            aria-label="Anrufen"
            className="press flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a]"
            onClick={() => showPlaceholder('Anrufe', 'Audio- und Videoanrufe gibt es in dieser Simulation nicht.')}
          >
            <Phone size={19} fill="#fff" strokeWidth={0} />
          </button>
          <button
            aria-label="Videoanruf"
            className="press flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a]"
            onClick={() => showPlaceholder('Anrufe', 'Audio- und Videoanrufe gibt es in dieser Simulation nicht.')}
          >
            <Video size={21} fill="#fff" strokeWidth={0} />
          </button>
        </div>
      </div>

      {/* messages */}
      <div ref={listRef} className="scroll min-h-0 flex-1 px-3 pb-3" data-testid="messages">
        {!messages.length && (
          <div className="flex flex-col items-center pt-16 text-center text-[#8a8a8a]">
            <Avatar src={contact.avatar} size={84} />
            <div className="mt-3 text-[17px] font-bold text-white"><Emo text={contact.name} /></div>
            <div className="mt-1 text-[13px]">Schreib die erste Nachricht.</div>
            <div className="mt-6 max-w-[260px] text-[11px] text-[#666]">Lokale Simulation – Nachrichten werden nur auf diesem Gerät gespeichert und nie an echte Konten gesendet.</div>
          </div>
        )}
        {blocks.map((b, bi) => (
          <Fragment key={bi}>
            {b.day && <div className="py-3 text-center text-[11px] font-semibold tracking-wide text-[#8a8a8a]">{b.day}</div>}
            <div className="mt-2">
              <div className="mb-[3px] text-[12px] font-bold tracking-wide" style={{ color: b.from === 'me' ? COLORS.red : COLORS.blue }}>
                <Emo text={b.from === 'me' ? myName.toUpperCase() : contact.name.toUpperCase()} />
              </div>
              {b.items.map((m) => (
                <MessageRow
                  key={m.id}
                  m={m}
                  color={b.from === 'me' ? COLORS.red : COLORS.blue}
                  showTime={showTime === m.id}
                  onTap={() => {
                    if (m.type === 'snap' && m.from === 'them' && m.status === 'delivered') openSnap(contactId);
                    else if (m.image && m.type === 'image') setFullImage(m.image);
                    else setShowTime(showTime === m.id ? null : m.id);
                  }}
                  onLong={() => setMenuFor(m)}
                />
              ))}
            </div>
          </Fragment>
        ))}
        {lastIsMine && lastMine && (
          <div className="mt-1 text-right text-[11px] font-medium text-[#8a8a8a]" data-testid="msg-status">
            {lastMine.status === 'opened' ? 'Geöffnet' : 'Zugestellt'}
          </div>
        )}
        {typing && (
          <div className="mt-3 flex items-center gap-2">
            <Avatar src={contact.avatar} size={26} />
            <div className="flex gap-1 rounded-full bg-[#2a2a2a] px-3 py-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-[6px] w-[6px] rounded-full bg-[#bbb]" style={{ animation: `typingDot 1s ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* emoji picker */}
      {emoji && (
        <div className="grid shrink-0 grid-cols-8 gap-1 border-t border-[#2a2a2a] bg-[#1a1a1a] p-2 text-[26px]">
          {EMOJIS.map((e, i) => (
            <button key={i} className="press" onClick={() => setText((t) => t + e)}>
              <Emo text={e} />
            </button>
          ))}
        </div>
      )}

      {/* input bar */}
      <div className="flex shrink-0 items-center gap-2 bg-[#121212] px-2 pt-2" style={{ paddingBottom: vh ? 8 : 'calc(8px + max(var(--sab), 0px))' }}>
        <button
          aria-label="Kamera"
          className="press flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#2a2a2a]"
          onClick={() => openCamera(contactId)}
        >
          <SnapCamIcon size={22} />
        </button>
        <div className="flex h-[42px] min-w-0 flex-1 items-center rounded-full bg-[#2a2a2a] pl-4 pr-1">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            onFocus={() => setEmoji(false)}
            placeholder="Chatten"
            enterKeyHint="send"
            data-testid="chat-input"
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[#8a8a8a]"
          />
          <button aria-label="Emoji" className="press p-2" onClick={() => setEmoji((v) => !v)}>
            <Smile size={22} color="#ddd" />
          </button>
          <button aria-label="Foto anhängen" className="press p-2" onClick={attach}>
            <ImageIcon size={22} color="#ddd" />
          </button>
        </div>
        {text.trim() && (
          <button
            aria-label="Senden"
            data-testid="send"
            className="press flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#0EADFF]"
            onClick={send}
          >
            <Send size={19} color="#fff" fill="#fff" />
          </button>
        )}
      </div>

      {menuFor && <MessageMenu contactId={contactId} m={menuFor} onClose={() => setMenuFor(null)} />}
      {options && <ChatOptions contactId={contactId} onClose={() => setOptions(false)} />}
      {fullImage && (
        <div className="anim-fade absolute inset-0 z-50 flex items-center justify-center bg-black" onClick={() => setFullImage(null)}>
          <img src={fullImage} alt="" className="max-h-full max-w-full object-contain" />
          <button aria-label="Schließen" className="absolute right-4 top-[calc(var(--top)+8px)] rounded-full bg-black/50 p-2">
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

function MessageRow({ m, color, showTime, onTap, onLong }: { m: Message; color: string; showTime: boolean; onTap: () => void; onLong: () => void }) {
  const press = useLongPress(onLong, onTap);
  return (
    <div {...press} className={`relative flex items-stretch rounded-md ${m.saved ? 'bg-[#2a2a2a]' : ''}`} data-testid="message">
      <div className="my-[2px] w-[2px] shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1 py-[3px] pl-[9px] pr-2">
        {m.type === 'text' && <div className="whitespace-pre-wrap break-words text-[16px] leading-[21px] text-white"><Emo text={m.text} /></div>}
        {m.type === 'image' && m.image && (
          <img src={m.image} alt="" draggable={false} className="my-1 max-h-[260px] max-w-[220px] rounded-xl object-cover" />
        )}
        {m.type === 'snap' && (
          <div className="flex items-center gap-2 py-1 text-[15px] font-semibold" style={{ color }}>
            {m.from === 'me' ? (
              <SentArrow color={color} filled={m.status === 'delivered'} size={17} />
            ) : (
              <StatusSquare color={color} filled={m.status === 'delivered'} size={15} />
            )}
            {m.from === 'me'
              ? m.status === 'opened'
                ? 'Snap geöffnet'
                : 'Snap zugestellt'
              : m.status === 'delivered'
                ? 'Neuer Snap – tippen zum Ansehen'
                : 'Snap geöffnet'}
          </div>
        )}
      </div>
      {(showTime || m.saved) && (
        <div className="shrink-0 self-center pr-2 text-[11px] text-[#8a8a8a]">
          {m.saved && <span className="mr-1 font-semibold">Gespeichert</span>}
          {showTime && clockTime(m.createdAt)}
        </div>
      )}
    </div>
  );
}

function MessageMenu({ contactId, m, onClose }: { contactId: string; m: Message; onClose: () => void }) {
  const { toggleSaved, deleteMessage, showToast } = useStore.getState();
  const item = (label: string, fn: () => void, danger = false) => (
    <button className={`press w-full rounded-xl bg-[#2a2a2a] px-4 py-3 text-left text-[16px] font-semibold ${danger ? 'text-[#ff453a]' : ''}`} onClick={() => { fn(); onClose(); }}>
      {label}
    </button>
  );
  return (
    <Sheet title="Nachricht" onClose={onClose}>
      <div className="flex flex-col gap-2 pt-1">
        {item(m.saved ? 'Nicht mehr im Chat speichern' : 'Im Chat speichern', () => toggleSaved(contactId, m.id))}
        {m.text && item('Kopieren', () => navigator.clipboard?.writeText(m.text!).then(() => showToast('Kopiert')))}
        <div className="px-1 pt-1 text-[12px] text-[#888]">{new Date(m.createdAt).toLocaleString('de-DE')}</div>
        {item('Löschen', () => deleteMessage(contactId, m.id), true)}
      </div>
    </Sheet>
  );
}

function ChatOptions({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const contact = useStore((s) => s.contacts.find((c) => c.id === contactId))!;
  const autoReplies = useStore((s) => s.settings.autoReplies);
  const { updateContact, receiveMessage, receiveSnap, setEditContact, setSheet, showToast } = useStore.getState();
  const [incoming, setIncoming] = useState('');
  return (
    <Sheet title="Chat-Optionen (Simulator)" onClose={onClose}>
      <Toggle
        label={<>Automatische Antworten {!autoReplies && <span className="text-[12px] text-[#888]">(global aus)</span>}</>}
        checked={contact.autoReply}
        onChange={(v) => updateContact(contactId, { autoReply: v })}
      />
      <label className="sheet-label">Eingehende Nachricht simulieren</label>
      <div className="flex gap-2">
        <input className="sheet-input" value={incoming} onChange={(e) => setIncoming(e.target.value)} placeholder={`Nachricht von ${contact.name}`} />
        <button
          className="press rounded-xl bg-[#0EADFF] px-4 font-semibold"
          onClick={() => {
            if (!incoming.trim()) return;
            receiveMessage(contactId, { text: incoming.trim() });
            setIncoming('');
            onClose();
          }}
        >
          OK
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <button
          className="sheet-btn"
          onClick={async () => {
            const f = await pickFile('image/*');
            if (!f) return;
            receiveSnap(contactId, await compressImage(f));
            showToast('Snap empfangen (simuliert)');
            onClose();
          }}
        >
          Eingehenden Snap simulieren (Bild wählen)
        </button>
        <button
          className="sheet-btn"
          onClick={() => {
            onClose();
            setTimeout(() => exportScreen(`chat-${contact.name}`), 50);
          }}
        >
          Screenshot dieses Chats exportieren
        </button>
        <button
          className="sheet-btn"
          onClick={() => {
            onClose();
            setEditContact(contactId);
            setSheet('contacts');
          }}
        >
          Kontakt bearbeiten
        </button>
        <button
          className="sheet-btn text-[#ff453a]"
          onClick={() => {
            if (!confirm('Alle Nachrichten in diesem Chat löschen?')) return;
            useStore.setState((s) => ({ messages: { ...s.messages, [contactId]: [] } }));
            onClose();
          }}
        >
          Chatverlauf löschen
        </button>
      </div>
    </Sheet>
  );
}
