import { useEffect, useState } from 'react';
import { Emo } from './Emoji';
import { Share, Trash2, X } from 'lucide-react';
import { useStore } from '../store';
import { relTime } from '../utils';
import { exportScreen } from '../export';
import { Avatar } from './common';

const SNAP_SECONDS = 10;
const STORY_SECONDS = 5;

export function SnapViewer() {
  const view = useStore((s) => s.snapView)!;
  const contact = useStore((s) => s.contacts.find((c) => c.id === view.contactId));
  const msg = useStore((s) => s.messages[view.contactId]?.find((m) => m.id === view.messageId));
  const closeSnap = useStore((s) => s.closeSnap);
  const exporting = useStore((s) => s.exporting);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || exporting) return;
    const t = setTimeout(closeSnap, SNAP_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [paused, exporting, closeSnap]);

  if (!msg || !contact) return null;
  return (
    <div className="anim-pop absolute inset-0 z-[55] bg-black" onClick={closeSnap} data-testid="snap-viewer">
      <img src={msg.image} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-x-0 top-[calc(var(--top)+6px)] flex items-center gap-2 px-3">
        <Avatar src={contact.avatar} size={34} />
        <div className="text-shadow flex-1">
          <div className="text-[15px] font-bold drop-shadow"><Emo text={contact.name} /></div>
          <div className="text-[12px] text-white/80 drop-shadow">{relTime(msg.createdAt)}</div>
        </div>
        <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full border-2 border-white/80 text-[12px] font-bold drop-shadow">
          {SNAP_SECONDS}
        </div>
        <button
          aria-label="Screenshot exportieren"
          className="no-export press rounded-full bg-black/30 p-2"
          onClick={(e) => {
            e.stopPropagation();
            setPaused(true);
            exportScreen('snap');
          }}
        >
          <Share size={18} />
        </button>
      </div>
    </div>
  );
}

export function StoryViewer() {
  const view = useStore((s) => s.storyView)!;
  const allStories = useStore((s) => s.stories);
  const stories = allStories.filter((x) => x.author === view.author);
  const contact = useStore((s) => s.contacts.find((c) => c.id === view.author));
  const settings = useStore((s) => s.settings);
  const exporting = useStore((s) => s.exporting);
  const { openStories, markStoriesViewed, deleteStory } = useStore.getState();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const story = stories[i];

  useEffect(() => {
    if (!story || paused || exporting) return;
    const t = setTimeout(() => (i < stories.length - 1 ? setI(i + 1) : close()), STORY_SECONDS * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, story?.id, paused, exporting]);

  const close = () => {
    markStoriesViewed(view.author);
    openStories(null);
  };

  if (!story) {
    return null;
  }
  const name = view.author === 'me' ? 'Meine Story' : contact?.name ?? '';
  const avatar = view.author === 'me' ? settings.myAvatar : contact?.avatar;

  return (
    <div
      className="anim-pop absolute inset-0 z-[55] bg-black"
      data-testid="story-viewer"
      onClick={(e) => {
        const left = e.clientX < (e.currentTarget as HTMLElement).getBoundingClientRect().left + 120;
        if (left) setI(Math.max(0, i - 1));
        else if (i < stories.length - 1) setI(i + 1);
        else close();
      }}
    >
      <img src={story.image} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-x-0 top-[calc(var(--top)+4px)] flex gap-[3px] px-2">
        {stories.map((s, k) => (
          <div key={s.id} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/35">
            <div
              key={`${s.id}-${i}-${paused}`}
              className="h-full origin-left bg-white"
              style={{
                transform: k < i ? 'scaleX(1)' : 'scaleX(0)',
                animation: k === i && !paused ? `progress ${STORY_SECONDS}s linear forwards` : undefined,
              }}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 top-[calc(var(--top)+14px)] flex items-center gap-2 px-3">
        <Avatar src={avatar} size={34} />
        <div className="flex-1">
          <div className="text-[15px] font-bold drop-shadow"><Emo text={name} /></div>
          <div className="text-[12px] text-white/80 drop-shadow">{relTime(story.createdAt)}</div>
        </div>
        <button
          aria-label="Screenshot exportieren"
          className="no-export press rounded-full bg-black/30 p-2"
          onClick={(e) => {
            e.stopPropagation();
            setPaused(true);
            exportScreen('story');
          }}
        >
          <Share size={18} />
        </button>
        <button
          aria-label="Story löschen"
          className="no-export press rounded-full bg-black/30 p-2"
          onClick={(e) => {
            e.stopPropagation();
            if (!confirm('Diesen Story-Snap löschen?')) return;
            deleteStory(story.id);
            if (stories.length <= 1) close();
            else setI(Math.max(0, i - 1));
          }}
        >
          <Trash2 size={18} />
        </button>
        <button
          aria-label="Schließen"
          className="press rounded-full bg-black/30 p-2"
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
