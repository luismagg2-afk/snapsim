import { useEffect, useState } from 'react';
import { Camera, Database, Images, Info, Smartphone, Users, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { storageEstimate } from '../db';
import { exportScreen } from '../export';
import { compressImage, downloadBlob, isIOS, isStandalone, pickFile } from '../utils';
import type { Backup } from '../types';
import { Avatar, Sheet, Toggle } from './common';
import { AvatarCropper, pickAvatarSource } from './ContactsEditor';

export function SimMenu() {
  const viewMode = useStore((s) => s.settings.viewMode);
  const { setSheet, updateSettings } = useStore.getState();
  const close = () => setSheet(null);
  const row = (icon: React.ReactNode, label: string, sub: string, fn: () => void, testid?: string) => (
    <button data-testid={testid} className="press flex w-full items-center gap-3 rounded-xl bg-[#2a2a2a] px-3 py-3 text-left" onClick={fn}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a3a3a]">{icon}</span>
      <span className="flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="block text-[12px] text-[#999]">{sub}</span>
      </span>
      <ChevronRight size={18} color="#777" />
    </button>
  );
  return (
    <Sheet title="Simulator" onClose={close}>
      <div className="mb-3">
        <div className="mb-1.5 text-[13px] font-medium text-[#9a9a9a]">Ansicht</div>
        <div className="flex rounded-xl bg-[#2a2a2a] p-1" data-testid="view-mode">
          {(
            [
              ['phone', 'iPhone'],
              ['web', 'Web'],
              ['auto', 'Automatisch'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              className="press flex-1 rounded-lg py-2 text-[14px] font-semibold"
              style={{ background: viewMode === v ? '#FFFC00' : 'transparent', color: viewMode === v ? '#000' : '#fff' }}
              onClick={() => updateSettings({ viewMode: v })}
            >
              {label}
            </button>
          ))}
        </div>
        {viewMode === 'auto' && <div className="mt-1 text-[11px] text-[#888]">Web ab 900 px Fensterbreite, sonst iPhone.</div>}
      </div>
      <div className="flex flex-col gap-2">
        {row(<Users size={18} />, 'Kontakte bearbeiten', 'Namen, Avatare, Streaks, Status, Reihenfolge', () => setSheet('contacts'), 'menu-contacts')}
        {row(<Camera size={18} />, 'Screenshot exportieren', 'Aktuelle Ansicht als PNG', () => exportScreen('chatliste'), 'menu-export')}
        {row(<Smartphone size={18} />, 'Statusleiste & Profil', 'Uhrzeit, Akku, Badges, Antworten', () => setSheet('statusbar'))}
        {row(<Database size={18} />, 'Backup & Speicher', 'JSON exportieren/importieren, zurücksetzen', () => setSheet('backup'), 'menu-backup')}
        {row(<Images size={18} />, 'Storys verwalten', 'Bilder für Storys & Entdecken, Story simulieren', () => setSheet('storyadmin'))}
        {row(<Info size={18} />, 'Info & Installation', 'Zum Home-Bildschirm hinzufügen', () => setSheet('about'))}
      </div>
      <p className="mt-4 text-center text-[11px] text-[#777]">
        SnapSim ist eine lokale Simulation. Nichts wird an Snapchat oder echte Konten gesendet.
      </p>
    </Sheet>
  );
}

export function PlaceholderSheet() {
  const p = useStore((s) => s.placeholder);
  const setSheet = useStore((s) => s.setSheet);
  return (
    <Sheet title={p?.title ?? ''} onClose={() => setSheet(null)}>
      <p className="pb-2 text-[15px] leading-relaxed text-[#ccc]">{p?.text}</p>
      <div className="mt-2 inline-block rounded-full bg-[#2a2a2a] px-3 py-1 text-[11px] text-[#999]">Platzhalter – nicht implementiert</div>
    </Sheet>
  );
}

export function StatusBarSheet() {
  const s = useStore((x) => x.settings);
  const { updateSettings, setSheet } = useStore.getState();
  const [crop, setCrop] = useState<string | null>(null);
  return (
    <Sheet title="Statusleiste & Profil" onClose={() => setSheet('menu')}>
      <label className="sheet-label">Simulierte Statusleiste</label>
      <select className="sheet-input" value={s.statusBarMode} onChange={(e) => updateSettings({ statusBarMode: e.target.value as never })}>
        <option value="auto">Automatisch (nur außerhalb des iPhones)</option>
        <option value="always">Immer (außer Home-Bildschirm-App)</option>
        <option value="never">Nie</option>
      </select>
      <p className="mt-1 text-[12px] text-[#888]">
        Auf dem iPhone ist die echte Statusleiste sichtbar, daher wird sie dort nicht doppelt gezeichnet. In Exporten kann sie unten eingeblendet werden.
      </p>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <div>
          <label className="sheet-label">Uhrzeit</label>
          <input className="sheet-input" value={s.sbTime} disabled={s.sbAutoTime} onChange={(e) => updateSettings({ sbTime: e.target.value })} />
        </div>
        <div>
          <label className="sheet-label">Akku %</label>
          <input
            className="sheet-input"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={s.sbBattery}
            onChange={(e) => updateSettings({ sbBattery: Math.max(0, Math.min(100, +e.target.value || 0)) })}
          />
        </div>
      </div>
      <label className="sheet-label">Netz-Balken ({s.sbSignal})</label>
      <input className="w-full" type="range" min={0} max={4} value={s.sbSignal} onChange={(e) => updateSettings({ sbSignal: +e.target.value })} />
      <Toggle label="Dynamic Island (wie Bildschirmaufnahme)" checked={s.sbIsland} onChange={(v) => updateSettings({ sbIsland: v })} />
      <Toggle label="Fokus-Symbol neben der Uhrzeit" checked={s.sbFocus} onChange={(v) => updateSettings({ sbFocus: v })} />
      <Toggle label="WLAN-Symbol" checked={s.sbWifi} onChange={(v) => updateSettings({ sbWifi: v })} />
      <Toggle label="Immer aktuelle Uhrzeit" checked={s.sbAutoTime} onChange={(v) => updateSettings({ sbAutoTime: v })} />
      <Toggle label="Statusleiste im Export" checked={s.exportStatusBar} onChange={(v) => updateSettings({ exportStatusBar: v })} />
      <Toggle label="„Simulation“-Hinweis im Export" checked={s.exportWatermark} onChange={(v) => updateSettings({ exportWatermark: v })} />

      <div className="mt-3 border-t border-[#2a2a2a] pt-2" />
      <Toggle label="Automatische Antworten (global)" checked={s.autoReplies} onChange={(v) => updateSettings({ autoReplies: v })} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="sheet-label">Badge „Freunde“</label>
          <input className="sheet-input" type="number" inputMode="numeric" value={s.addFriendBadge} onChange={(e) => updateSettings({ addFriendBadge: Math.max(0, +e.target.value || 0) })} />
        </div>
        <div>
          <label className="sheet-label">Badge „Flashbacks“</label>
          <input className="sheet-input" type="number" inputMode="numeric" value={s.flashbacksBadge} onChange={(e) => updateSettings({ flashbacksBadge: Math.max(0, +e.target.value || 0) })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="sheet-label">Karte: Ortsname</label>
          <input className="sheet-input" value={s.mapTitle} onChange={(e) => updateSettings({ mapTitle: e.target.value })} />
        </div>
        <div>
          <label className="sheet-label">Karte: Wetter</label>
          <input className="sheet-input" value={s.mapWeather} onChange={(e) => updateSettings({ mapWeather: e.target.value })} />
        </div>
      </div>
      <label className="sheet-label">Mein Name im Chat</label>
      <input className="sheet-input" value={s.myName} onChange={(e) => updateSettings({ myName: e.target.value })} />
      <label className="sheet-label">Mein Avatar</label>
      <div className="flex items-center gap-3">
        <Avatar src={s.myAvatar} size={52} />
        <button className="sheet-btn flex-1" onClick={async () => setCrop(await pickAvatarSource())}>
          Bild wählen & zuschneiden
        </button>
      </div>

      <div className="mt-4 border-t border-[#2a2a2a] pt-2 text-[15px] font-bold">Web-Ansicht</div>
      <Toggle label="Banner „Desktop-App installieren“" checked={s.webBanner} onChange={(v) => updateSettings({ webBanner: v })} />
      <label className="sheet-label">Hintergrund rechts (z. B. Screenshot deiner Bitmoji-Szene)</label>
      <div className="flex gap-2">
        <button
          className="sheet-btn flex-1"
          onClick={async () => {
            const f = await pickFile('image/*');
            if (f) updateSettings({ webBackground: await compressImage(f, 2000, 0.85) });
          }}
        >
          Bild wählen
        </button>
        {s.webBackground && (
          <button className="sheet-btn w-auto" onClick={() => updateSettings({ webBackground: '' })}>
            Standard
          </button>
        )}
      </div>
      {crop && <AvatarCropper src={crop} onClose={() => setCrop(null)} onDone={(url) => updateSettings({ myAvatar: url })} />}
    </Sheet>
  );
}

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export function BackupSheet() {
  const { exportBackup, importBackup, resetAll, setSheet, showToast, restoreDefaults } = useStore.getState();
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  useEffect(() => {
    storageEstimate().then(setEst);
  }, []);

  const doExport = () => {
    const json = JSON.stringify(exportBackup());
    downloadBlob(new Blob([json], { type: 'application/json' }), `snapsim-backup-${new Date().toISOString().slice(0, 10)}.json`);
    showToast('Backup exportiert');
  };
  const doImport = async () => {
    const f = await pickFile('application/json,.json');
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as Backup;
      if (!confirm('Backup importieren? Alle aktuellen Daten werden ersetzt.')) return;
      await importBackup(data);
      showToast('Backup importiert');
      setSheet(null);
    } catch (e) {
      alert('Import fehlgeschlagen: ' + (e as Error).message);
    }
  };

  return (
    <Sheet title="Backup & Speicher" onClose={() => setSheet('menu')}>
      <div className="rounded-xl bg-[#2a2a2a] p-3 text-[13px] leading-relaxed text-[#bbb]">
        Alle Daten (Kontakte, Nachrichten, Snaps, Stories, Einstellungen) liegen nur lokal in diesem Browser (IndexedDB).
        Wenn du Website-Daten in Safari löschst oder die Home-Bildschirm-App entfernst, sind sie weg – exportiere regelmäßig ein Backup.
        {est && est.quota > 0 && (
          <div className="mt-2 text-white">
            Belegt: {mb(est.usage)} von ca. {mb(est.quota)}
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#444]">
              <div className="h-full bg-[#FFFC00]" style={{ width: `${Math.min(100, (est.usage / est.quota) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <button className="sheet-btn" data-testid="backup-export" onClick={doExport}>
          JSON-Backup exportieren
        </button>
        <button className="sheet-btn" data-testid="backup-import" onClick={doImport}>
          JSON-Backup importieren
        </button>
        <button
          className="sheet-btn"
          onClick={() => {
            if (!confirm('Standard-Kontaktliste aus dem Screenshot wiederherstellen? Eigene Kontakte und Chats werden entfernt.')) return;
            restoreDefaults();
            showToast('Standard-Kontakte wiederhergestellt');
          }}
        >
          Standard-Kontakte wiederherstellen
        </button>
        <button
          className="sheet-btn text-[#ff453a]"
          onClick={async () => {
            if (!confirm('Wirklich ALLES zurücksetzen? Das kann nicht rückgängig gemacht werden.')) return;
            await resetAll();
            showToast('Alles zurückgesetzt');
            setSheet(null);
          }}
        >
          Alles zurücksetzen
        </button>
      </div>
    </Sheet>
  );
}

export function AboutSheet() {
  const setSheet = useStore((s) => s.setSheet);
  const ios = isIOS();
  const standalone = isStandalone();
  return (
    <Sheet title="Info & Installation" onClose={() => setSheet('menu')}>
      <div className="space-y-3 text-[14px] leading-relaxed text-[#ccc]">
        <p>
          <b className="text-white">SnapSim</b> ist eine inoffizielle, rein lokale Simulation einer Chat-Oberfläche. Sie ist nicht mit Snap Inc. verbunden.
          Nachrichten und Snaps verlassen nie dieses Gerät.
        </p>
        <p className="rounded-xl bg-[#2a2a2a] p-3">
          {standalone
            ? '✅ Läuft als Home-Bildschirm-App.'
            : ios
              ? 'Installieren: In Safari unten auf „Teilen“ tippen → „Zum Home-Bildschirm“ → „Hinzufügen“.'
              : 'Auf dem iPhone in Safari öffnen und über „Teilen“ → „Zum Home-Bildschirm“ installieren.'}
        </p>
        <p className="text-[12px] text-[#888]">
          Versteckte Bearbeitung: Halte eine Kontaktzeile lange gedrückt, um diesen Kontakt direkt zu bearbeiten. Tippe im Chat auf den Namen für Simulator-Optionen.
        </p>
      </div>
    </Sheet>
  );
}
