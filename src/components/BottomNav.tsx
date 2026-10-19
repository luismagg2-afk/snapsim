import { useMemo } from 'react';
import { ChevronUp } from 'lucide-react';
import { useStore } from '../store';
import type { Screen } from '../types';
import { CameraNavIcon, ChatNavIcon, FriendsNavIcon, MapNavIcon, MapPinFilled, PlayNavIcon, SpotlightNavIcon } from './icons';

// Matches the iOS app: the 4th tab is the friends/Storys icon (filled when active). With unseen
// stories it shows a red dot, and on the chat tab the newest story's thumbnail in a purple ring.
// On the camera tab the camera button becomes the latest Memory thumbnail and the 5th tab a ▷.
export default function BottomNav() {
  const screen = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);
  const stories = useStore((s) => s.stories);
  const messages = useStore((s) => s.messages);
  const unseen = stories.filter((x) => x.author !== 'me' && !x.viewed);
  const onCamera = screen === 'camera';

  // newest picture you took: own story or a Snap you sent
  const memory = useMemo(() => {
    let best: { t: number; img: string } | null = null;
    for (const s of stories) if (s.author === 'me' && (!best || s.createdAt > best.t)) best = { t: s.createdAt, img: s.image };
    for (const list of Object.values(messages))
      for (const m of list) if (m.from === 'me' && m.type === 'snap' && m.image && (!best || m.createdAt > best.t)) best = { t: m.createdAt, img: m.image };
    return best?.img ?? null;
  }, [stories, messages]);

  const dot = <span className="absolute right-[17px] top-[5px] h-[13px] w-[13px] rounded-full bg-[#F23C57]" />;

  const item = (id: Screen, label: string, icon: React.ReactNode, extra?: React.ReactNode) => (
    <button
      key={id}
      aria-label={label}
      data-testid={`nav-${id}`}
      className="press relative flex h-[49px] w-[72px] items-center justify-center"
      onClick={() => setScreen(id)}
    >
      {icon}
      {extra}
    </button>
  );

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-30 flex justify-center border-t border-[#2e2e2e] bg-[#1e1e1e] pt-[10px]"
      style={{ height: 'var(--nav)' }}
    >
      {item('map', 'Karte', screen === 'map' ? <MapPinFilled size={28} /> : <MapNavIcon size={28} />)}
      {item('chat', 'Chat', <ChatNavIcon size={28} active={screen === 'chat'} />)}
      {item(
        'camera',
        'Kamera',
        onCamera && memory ? (
          <div className="relative -mt-[8px] flex flex-col items-center">
            <ChevronUp size={16} strokeWidth={3} className="-mb-[2px]" />
            <div className="h-[39px] w-[39px] overflow-hidden rounded-[9px] border border-white/20">
              <img src={memory} alt="" className="h-full w-full object-cover" draggable={false} />
            </div>
          </div>
        ) : (
          <CameraNavIcon size={28} />
        ),
      )}
      {item(
        'stories',
        'Storys',
        screen === 'chat' && unseen.length ? (
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-[2.5px] border-[#A05DCD]">
            <div className="h-[25px] w-[25px] overflow-hidden rounded-full bg-[#ddd]">
              <img src={unseen[unseen.length - 1].image} alt="" className="h-full w-full object-cover" draggable={false} />
            </div>
          </div>
        ) : (
          <FriendsNavIcon size={28} active={screen === 'stories'} />
        ),
        screen !== 'chat' && screen !== 'stories' && unseen.length ? dot : undefined,
      )}
      {item(
        'spotlight',
        'Spotlight',
        onCamera ? <PlayNavIcon size={28} /> : <SpotlightNavIcon size={28} active={screen === 'spotlight'} />,
        onCamera ? undefined : dot,
      )}
    </nav>
  );
}
