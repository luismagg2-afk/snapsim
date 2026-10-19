import { Heart, MessageCircle, Plus, Share2 } from 'lucide-react';
import { useStore } from '../store';
import { compressImage, pickFile } from '../utils';

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')}K` : String(n));

export default function SpotlightScreen() {
  const items = useStore((s) => s.spotlight);
  const { toggleLike, addSpotlight, showPlaceholder, showToast } = useStore.getState();

  const upload = async () => {
    const f = await pickFile('image/*');
    if (!f) return;
    addSpotlight(await compressImage(f), 'Mein Spotlight');
    showToast('Lokal zu Spotlight hinzugefügt');
  };

  return (
    <div className="absolute inset-0 bg-black" data-testid="spotlight">
      <div className="scroll h-full snap-y snap-mandatory" style={{ paddingBottom: 0 }}>
        {items.map((it) => (
          <section key={it.id} className="relative h-full w-full snap-start overflow-hidden" style={{ background: it.gradient ?? '#111' }}>
            {it.image ? (
              <img src={it.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[120px]">{it.emoji}</div>
            )}
            <div className="absolute right-3 flex flex-col items-center gap-5" style={{ bottom: 'calc(var(--nav) + 40px)' }}>
              <button aria-label="Gefällt mir" className="press flex flex-col items-center gap-1" onClick={() => toggleLike(it.id)}>
                <Heart size={32} fill={it.liked ? '#F23C57' : 'rgba(0,0,0,.2)'} color={it.liked ? '#F23C57' : '#fff'} />
                <span className="text-[12px] font-semibold drop-shadow">{fmt(it.likes)}</span>
              </button>
              <button aria-label="Kommentare" className="press flex flex-col items-center gap-1" onClick={() => showPlaceholder('Kommentare', 'Kommentare sind in dieser Demo-Ansicht nicht verfügbar.')}>
                <MessageCircle size={30} />
                <span className="text-[12px] font-semibold drop-shadow">{Math.floor(it.likes / 37)}</span>
              </button>
              <button aria-label="Teilen" className="press" onClick={() => showPlaceholder('Teilen', 'Teilen ist in der Spotlight-Demo nicht verfügbar.')}>
                <Share2 size={28} />
              </button>
            </div>
            <div className="absolute left-4 right-20" style={{ bottom: 'calc(var(--nav) + 18px)' }}>
              <div className="text-[15px] font-bold drop-shadow">@{it.author}</div>
              <div className="mt-1 text-[14px] drop-shadow">{it.caption}</div>
            </div>
          </section>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--top)+10px)] flex items-center justify-center">
        <span className="text-[19px] font-bold drop-shadow">Spotlight</span>
      </div>
      <button
        aria-label="Eigenes Bild hinzufügen"
        className="press absolute right-3 top-[calc(var(--top)+4px)] flex h-[40px] w-[40px] items-center justify-center rounded-full bg-black/30"
        onClick={upload}
      >
        <Plus size={22} />
      </button>
      <div className="pointer-events-none absolute left-3 top-[calc(var(--top)+14px)] rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white/70">Demo-Feed</div>
    </div>
  );
}
