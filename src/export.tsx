import { toPng } from 'html-to-image';
import { create } from 'zustand';
import { Download, X } from 'lucide-react';
import { useStore } from './store';
import { dataUrlToBlob, shareOrDownload } from './utils';

const useExport = create<{ url: string | null; name: string }>(() => ({ url: null, name: '' }));

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

/**
 * Renders the visible phone screen (#screen) to a PNG at 3× (iPhone resolution).
 * Elements with the `no-export` class (sheets, edit buttons, toasts) are left out.
 */
export async function exportScreen(name = 'screen') {
  const store = useStore.getState();
  store.setSheet(null);
  store.setExporting(true);
  try {
    await frame();
    await document.fonts?.ready;
    const node = document.getElementById('screen');
    if (!node) throw new Error('Screen not found');
    const opts = {
      // phone: 3× like an iPhone; web view: 2× like a Retina laptop
      pixelRatio: node.clientWidth > 600 ? 2 : 3,
      backgroundColor: '#121212',
      width: node.clientWidth,
      height: node.clientHeight,
      style: { boxShadow: 'none', margin: '0' },
      filter: (n: HTMLElement) => !(n.classList && n.classList.contains('no-export')),
    };
    // Safari often drops images on the first pass; render twice.
    await toPng(node, opts).catch(() => undefined);
    const url = await toPng(node, opts);
    useExport.setState({ url, name: `snapsim-${name}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png` });
  } catch (e) {
    console.error(e);
    store.showToast('Export fehlgeschlagen: ' + (e as Error).message);
  } finally {
    store.setExporting(false);
  }
}

export function ExportResult() {
  const { url, name } = useExport();
  if (!url) return null;
  const close = () => useExport.setState({ url: null });
  return (
    <div className="no-export anim-fade absolute inset-0 z-[120] flex flex-col bg-black/90 pb-[calc(16px+var(--sab))] pt-[calc(var(--top)+8px)]">
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="text-[17px] font-bold">Screenshot (Simulation)</div>
        <button aria-label="Schließen" className="press flex h-9 w-9 items-center justify-center rounded-full bg-[#2f2f2f]" onClick={close}>
          <X size={20} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <img src={url} alt="Export" data-testid="export-image" className="max-h-full max-w-full rounded-xl border border-[#333] object-contain" />
      </div>
      <div className="px-4 pt-4">
        <button
          className="press flex w-full items-center justify-center gap-2 rounded-full bg-[#FFFC00] py-3.5 text-[16px] font-bold text-black"
          onClick={async () => shareOrDownload(await dataUrlToBlob(url), name)}
        >
          <Download size={19} /> Sichern / Teilen
        </button>
        <div className="mt-2 text-center text-[12px] text-[#888]">Tipp für iPhone: Bild lange drücken → „Zu Fotos hinzufügen“.</div>
      </div>
    </div>
  );
}
