import { useEffect, useMemo, useState } from 'react';
import { useStore } from './store';
import { isIOS, isStandalone } from './utils';
import ChatList from './components/ChatList';
import BottomNav from './components/BottomNav';
import ChatView from './components/ChatView';
import CameraScreen from './components/Camera';
import { SnapViewer, StoryViewer } from './components/Viewers';
import StoriesScreen from './components/Stories';
import SpotlightScreen from './components/Spotlight';
import MapScreen from './components/MapScreen';
import { SimMenu, PlaceholderSheet, StatusBarSheet, BackupSheet, AboutSheet } from './components/Sheets';
import ContactsEditor from './components/ContactsEditor';
import { StatusBar, Toast } from './components/common';
import { ExportResult } from './export';
import WebLayout from './components/WebLayout';

export default function App() {
  const ready = useStore((s) => s.ready);
  const screen = useStore((s) => s.screen);
  const openChatId = useStore((s) => s.openChatId);
  const sheet = useStore((s) => s.sheet);
  const snapView = useStore((s) => s.snapView);
  const storyView = useStore((s) => s.storyView);
  const exporting = useStore((s) => s.exporting);
  const settings = useStore((s) => s.settings);

  const env = useMemo(() => ({ ios: isIOS(), standalone: isStandalone() }), []);
  const [wide, setWide] = useState(() => window.innerWidth >= 900);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const web = settings.viewMode === 'web' || (settings.viewMode === 'auto' && wide);

  // On a real iPhone the system status bar is already there, so the simulated one is
  // only drawn in the desktop preview, when forced, or inside exported screenshots.
  const showBar =
    (exporting && settings.exportStatusBar) ||
    (!exporting &&
      (settings.statusBarMode === 'always'
        ? !env.standalone
        : settings.statusBarMode === 'auto'
          ? !env.ios
          : false));
  const fakeHome = !env.ios || exporting;
  const top = showBar ? '59px' : 'env(safe-area-inset-top, 0px)';
  const nav = fakeHome ? '93px' : 'calc(59px + env(safe-area-inset-bottom, 0px))';

  useEffect(() => {
    document.getElementById('boot')?.remove();
  }, []);

  if (!ready) return <div className="screen" />;

  if (web) {
    return (
      <div id="screen" className={`screen web ${exporting ? 'exporting' : ''}`} style={{ ['--top' as string]: '0px', ['--nav' as string]: '0px' }}>
        <WebLayout />
        {sheet === 'menu' && <SimMenu />}
        {sheet === 'contacts' && <ContactsEditor />}
        {sheet === 'statusbar' && <StatusBarSheet />}
        {sheet === 'backup' && <BackupSheet />}
        {sheet === 'about' && <AboutSheet />}
        {sheet === 'placeholder' && <PlaceholderSheet />}
        {exporting && settings.exportWatermark && (
          <div className="pointer-events-none absolute bottom-[3px] right-[8px] z-[100] text-[9px] font-medium tracking-wide text-white/30">Simulation · SnapSim</div>
        )}
        <Toast />
        <ExportResult />
      </div>
    );
  }

  return (
    <div
      id="screen"
      className={`screen ${exporting ? 'exporting' : ''}`}
      style={{ ['--top' as string]: top, ['--nav' as string]: nav }}
    >
      {showBar && <StatusBar />}

      {screen === 'chat' && <ChatList />}
      {screen === 'map' && <MapScreen />}
      {screen === 'camera' && <CameraScreen />}
      {screen === 'stories' && <StoriesScreen />}
      {screen === 'spotlight' && <SpotlightScreen />}
      <BottomNav />

      {openChatId && <ChatView key={openChatId} contactId={openChatId} />}
      {snapView && <SnapViewer />}
      {storyView && <StoryViewer />}

      {sheet === 'menu' && <SimMenu />}
      {sheet === 'contacts' && <ContactsEditor />}
      {sheet === 'statusbar' && <StatusBarSheet />}
      {sheet === 'backup' && <BackupSheet />}
      {sheet === 'about' && <AboutSheet />}
      {sheet === 'placeholder' && <PlaceholderSheet />}

      {exporting && settings.exportWatermark && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[3px] z-[100] text-center text-[8px] font-medium tracking-wide text-white/30">
          Simulation · SnapSim
        </div>
      )}
      <Toast />
      <ExportResult />
    </div>
  );
}
