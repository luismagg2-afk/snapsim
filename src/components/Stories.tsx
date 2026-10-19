import { ChevronRight, Plus, Trash2, VolumeX } from 'lucide-react';
import { useStore } from '../store';
import { compressImage, pickFile, pickFiles } from '../utils';
import { TopHeader } from './ChatList';
import { Avatar, Sheet } from './common';
import { Emo } from './Emoji';

// "Storys" tab of the iOS app. Positions in pt, measured from the reference screenshot:
// friend circles 85pt (ring + gap + photo) every 101.4pt, purple "+" pill, name + handle,
// then a 2-column grid of 183.5×304pt tiles with 9pt gaps. Tiles only ever show real pictures
// (your stories, friends' simulated stories, images you added); empty slots look like the app's
// loading placeholders instead of fake artwork.
const MIN_TILES = 6;

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
  const { openStories, openChat, setScreen } = useStore.getState();

  const friends = contacts
    .map((c) => ({ c, list: stories.filter((s) => s.author === c.id) }))
    .sort((a, b) => Number(b.list.length > 0) - Number(a.list.length > 0));

  const tiles: { key: string; image: string; caption: string; open: () => void }[] = [
    ...[...stories].reverse().map((s) => ({
      key: s.id,
      image: s.image,
      caption: '',
      open: () => openStories(s.author),
    })),
    ...spotlight
      .filter((it) => it.image)
      .map((it) => ({ key: it.id, image: it.image!, caption: it.caption, open: () => setScreen('spotlight') })),
  ];
  const placeholders = Math.max(0, MIN_TILES - tiles.length);

  return (
    <div className="absolute inset-0 flex flex-col pt-[var(--top)]" data-testid="stories">
      <TopHeader title="Storys" plainAdd />
      <div className="scroll min-h-0 flex-1 pb-[calc(var(--nav)+12px)]">
        <button className="press flex items-center gap-[1px] pl-[12px] pt-[6px] text-[17px] font-semibold text-[#e9e9e9]">
          Freunde <ChevronRight size={19} strokeWidth={2.4} />
        </button>

        <div className="scroll mt-[1px] flex overflow-x-auto pl-[5px] pr-[5px]">
          {friends.map(({ c, list }) => {
            const unseen = list.some((s) => !s.viewed);
            const ring = list.length && !unseen ? '#5a5a5a' : '#b428fb';
            return (
              <div key={c.id} className="relative flex w-[101.4px] shrink-0 flex-col items-center">
                <button
                  className="press"
                  aria-label={c.name}
                  onClick={() => (list.length ? openStories(c.id) : openChat(c.id))}
                >
                  <div className="flex h-[91px] w-[91px] items-center justify-center rounded-full" style={{ border: `3px solid ${ring}` }}>
                    <div className="h-[81px] w-[81px] overflow-hidden rounded-full bg-[#2a2a2a]">
                      <img src={list[list.length - 1]?.image ?? c.avatar} alt="" className="h-full w-full object-cover" draggable={false} />
                    </div>
                  </div>
                </button>
                <button
                  aria-label={`Chat mit ${c.name}`}
                  className="press absolute top-[75.5px] flex h-[21px] w-[50px] items-center justify-center gap-[1px] rounded-full bg-[#b428fb]"
                  onClick={() => openChat(c.id)}
                >
                  <Plus size={12} strokeWidth={3.6} />
                  <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="7" r="5" fill="#fff" />
                    <path d="M2 23c0-6 4.5-9 10-9s10 3 10 9Z" fill="#fff" />
                  </svg>
                </button>
                <div className="mt-[8px] w-[96px] overflow-hidden text-ellipsis whitespace-nowrap text-center text-[15px] font-semibold leading-[20px]">
                  <Emo text={c.name} />
                </div>
                <div className="w-[96px] overflow-hidden text-ellipsis whitespace-nowrap text-center text-[13.5px] leading-[18px] text-[#8a8a8a]">
                  {handle(c.name)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-[5px] grid grid-cols-2 gap-[9px] px-[8.5px]">
          {tiles.map((t) => (
            <button key={t.key} className="press relative h-[304px] overflow-hidden rounded-[10px] bg-[#1c1c1c]" onClick={t.open}>
              <img src={t.image} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              {t.caption && (
                <div className="absolute inset-x-0 top-[28px] bg-black/55 px-2 py-[5px] text-center text-[12px] leading-tight">
                  <Emo text={t.caption} />
                </div>
              )}
              <VolumeX size={17} className="absolute bottom-[12px] right-[12px] opacity-90" />
            </button>
          ))}
          {Array.from({ length: placeholders }, (_, i) => (
            <div key={`ph${i}`} className="skeleton h-[304px] rounded-[10px]" aria-hidden />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Simulator-only tools for this tab (opened from the ••• menu, never shown on the tab itself). */
export function StoryAdminSheet() {
  const contacts = useStore((s) => s.contacts);
  const spotlight = useStore((s) => s.spotlight);
  const { addStory, addSpotlight, removeSpotlight, updateContact, showToast, setSheet } = useStore.getState();
  const images = spotlight.filter((x) => x.image);

  const addImages = async () => {
    const files = await pickFiles('image/*');
    for (const f of files) addSpotlight(await compressImage(f), '');
    if (files.length) showToast(`${files.length} Bild(er) hinzugefügt`);
  };
  const addMine = async () => {
    const f = await pickFile('image/*');
    if (!f) return;
    addStory('me', await compressImage(f));
    showToast('Zu Meine Story hinzugefügt (lokal)');
  };

  return (
    <Sheet title="Storys verwalten" onClose={() => setSheet('menu')}>
      <p className="pb-2 text-[13px] text-[#999]">
        Die Kacheln im Storys-Tab zeigen nur echte Bilder: deine Storys, simulierte Freundes-Storys und Bilder, die du hier hinzufügst.
        Freie Plätze erscheinen als graue Lade-Kacheln.
      </p>
      <div className="flex flex-col gap-2">
        <button className="sheet-btn" onClick={addImages}>
          <Plus size={18} /> Bilder für Entdecken hinzufügen
        </button>
        <button className="sheet-btn" onClick={addMine}>
          <Plus size={18} /> Zu Meine Story hinzufügen
        </button>
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.map((it) => (
            <div key={it.id} className="relative aspect-[9/16] overflow-hidden rounded-lg bg-[#222]">
              <img src={it.image} alt="" className="h-full w-full object-cover" />
              <button aria-label="Bild entfernen" className="absolute right-1 top-1 rounded-full bg-black/60 p-1" onClick={() => removeSpotlight(it.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-1 mt-4 text-[13px] font-medium text-[#9a9a9a]">Story eines Freundes simulieren</div>
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
