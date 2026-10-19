import { useState } from 'react';
import { ChevronRight, Plus, VolumeX } from 'lucide-react';
import { useStore } from '../store';
import { compressImage, pickFile } from '../utils';
import { TopHeader } from './ChatList';
import { Avatar, Sheet } from './common';
import { Emo } from './Emoji';

// "Storys" tab of the iOS app. Positions in pt, measured from the reference screenshot:
// friend circles 85pt (ring + gap + photo) every 101.4pt, purple "+" pill, name + handle,
// then a 2-column grid of 183.5×304pt tiles with 9pt gaps.
const handle = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'snap';

export default function StoriesScreen() {
  const stories = useStore((s) => s.stories);
  const contacts = useStore((s) => s.contacts);
  const spotlight = useStore((s) => s.spotlight);
  const settings = useStore((s) => s.settings);
  const { openStories, addStory, showToast, setScreen } = useStore.getState();
  const [adding, setAdding] = useState(false);

  const mine = stories.filter((s) => s.author === 'me');
  const withStories = contacts
    .map((c) => ({ c, list: stories.filter((s) => s.author === c.id) }))
    .sort((a, b) => Number(b.list.length > 0) - Number(a.list.length > 0));

  const addMine = async () => {
    const f = await pickFile('image/*');
    if (!f) return;
    addStory('me', await compressImage(f));
    showToast('Zu Meine Story hinzugefügt (lokal)');
  };

  // grid: newest friend/own stories first, then the local demo feed
  const tiles: { key: string; image?: string; gradient?: string; emoji?: string; caption: string; open: () => void }[] = [
    ...[...stories].reverse().map((s) => ({
      key: s.id,
      image: s.image,
      caption: s.author === 'me' ? 'Meine Story' : contacts.find((c) => c.id === s.author)?.name ?? '',
      open: () => openStories(s.author),
    })),
    ...spotlight.map((it) => ({ key: it.id, image: it.image, gradient: it.gradient, emoji: it.emoji, caption: it.caption, open: () => setScreen('spotlight') })),
  ];

  const circle = (key: string, ring: 'unseen' | 'seen' | 'none', img: string | undefined, name: string, sub: string, onClick: () => void, pill?: () => void) => (
    <div key={key} className="relative flex w-[96px] shrink-0 flex-col items-center">
      <button className="press relative" onClick={onClick} aria-label={name}>
        <div
          className="flex h-[85px] w-[85px] items-center justify-center rounded-full"
          style={{ border: `2.6px solid ${ring === 'unseen' ? '#b428fb' : ring === 'seen' ? '#5a5a5a' : 'transparent'}` }}
        >
          <div className="h-[74px] w-[74px] overflow-hidden rounded-full bg-[#2a2a2a]">
            {img ? <img src={img} alt="" className="h-full w-full object-cover" draggable={false} /> : <Avatar size={74} />}
          </div>
        </div>
      </button>
      {pill && (
        <button
          aria-label="Hinzufügen"
          className="press absolute top-[72px] flex h-[20px] w-[47px] items-center justify-center rounded-full bg-[#b428fb]"
          onClick={pill}
        >
          <Plus size={13} strokeWidth={3.4} />
          <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="7" r="5" fill="#fff" />
            <path d="M2 23c0-6 4.5-9 10-9s10 3 10 9Z" fill="#fff" />
          </svg>
        </button>
      )}
      <div className="mt-[12px] w-full truncate text-center text-[16px] font-semibold leading-[20px]">
        <Emo text={name} />
      </div>
      <div className="w-full truncate text-center text-[14px] leading-[18px] text-[#8a8a8a]">{sub}</div>
    </div>
  );

  return (
    <div className="absolute inset-0 flex flex-col pt-[var(--top)]" data-testid="stories">
      <TopHeader title="Storys" plainAdd />
      <div className="scroll min-h-0 flex-1 pb-[calc(var(--nav)+20px)]">
        <button className="press flex items-center gap-[2px] pl-[12px] pt-[7px] text-[17px] font-semibold text-[#e9e9e9]">
          Freunde <ChevronRight size={18} strokeWidth={2.6} />
        </button>
        <div className="scroll mt-[10px] flex overflow-x-auto pl-[8px] pr-2">
          {circle('me', mine.length ? 'unseen' : 'none', mine[mine.length - 1]?.image ?? settings.myAvatar, 'Meine Story', settings.myName.toLowerCase(), () => (mine.length ? openStories('me') : addMine()), addMine)}
          {withStories.map(({ c, list }) =>
            circle(
              c.id,
              list.length ? (list.some((s) => !s.viewed) ? 'unseen' : 'seen') : c.storyRing,
              list[list.length - 1]?.image ?? c.avatar,
              c.name,
              handle(c.name),
              () => (list.length ? openStories(c.id) : useStore.getState().openChat(c.id)),
            ),
          )}
        </div>

        <div className="mt-[14px] grid grid-cols-2 gap-[9px] px-[8.5px]">
          {tiles.map((t) => (
            <button key={t.key} className="press relative h-[304px] overflow-hidden rounded-[10px] bg-[#222]" onClick={t.open} style={{ background: t.gradient }}>
              {t.image ? (
                <img src={t.image} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[72px]">
                  <Emo text={t.emoji} />
                </div>
              )}
              {t.caption && (
                <div className="absolute inset-x-0 top-[28px] bg-black/55 px-2 py-[6px] text-center text-[12.5px] font-medium leading-tight">
                  <Emo text={t.caption} />
                </div>
              )}
              <VolumeX size={17} className="absolute bottom-[12px] right-[12px] opacity-90" />
            </button>
          ))}
        </div>

        <div className="no-export mt-6 flex flex-col gap-2 px-4">
          <button className="sheet-btn" onClick={addMine}>
            <Plus size={18} /> Zu Meine Story hinzufügen
          </button>
          <button className="sheet-btn" onClick={() => setAdding(true)}>
            <Plus size={18} /> Story eines Freundes simulieren
          </button>
        </div>
      </div>
      {adding && <FriendStorySheet onClose={() => setAdding(false)} />}
    </div>
  );
}

function FriendStorySheet({ onClose }: { onClose: () => void }) {
  const contacts = useStore((s) => s.contacts);
  const { addStory, updateContact, showToast } = useStore.getState();
  return (
    <Sheet title="Story von wem?" onClose={onClose}>
      {contacts.map((c) => (
        <button
          key={c.id}
          className="row-press flex w-full items-center gap-3 rounded-xl px-1 py-2"
          onClick={async () => {
            const f = await pickFile('image/*');
            if (!f) return;
            addStory(c.id, await compressImage(f));
            updateContact(c.id, { storyRing: 'unseen' });
            showToast(`Story von ${c.name} hinzugefügt (simuliert)`);
            onClose();
          }}
        >
          <Avatar src={c.avatar} size={40} />
          <span className="text-[16px] font-medium">
            <Emo text={c.name} />
          </span>
        </button>
      ))}
    </Sheet>
  );
}
