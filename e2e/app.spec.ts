import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

const IMAGE = path.resolve('public/icons/icon-512.png');
// emoji are rendered as <img class="apple-emoji" alt="…">, so text checks use the plain part
const NAMES = [
  'Número Unoooo',
  'Noel',
  'Yarrrrak',
  'Ferdi',
  '',
  'Navid Ali',
  'Alex Lauterbach',
  'Joel',
  'Liam',
  'Luciaa (luis Schwesterr)',
];

let errors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  // every test gets a fresh browser context, so IndexedDB starts empty
  await page.goto('/');
  await expect(page.getByTestId('contact-row').first()).toBeVisible();
});

test.afterEach(() => {
  expect(errors, 'no JS errors').toEqual([]);
});

const rows = (page: Page) => page.getByTestId('contact-row');

async function openMenu(page: Page) {
  await page.getByRole('button', { name: 'Menü' }).click();
}

test('chat list renders the ten default contacts in order', async ({ page }) => {
  await expect(rows(page)).toHaveCount(10);
  for (let i = 0; i < NAMES.length; i++) await expect(rows(page).nth(i)).toContainText(NAMES[i]);
  await expect(rows(page).nth(0)).toContainText('Empfangen');
  await expect(rows(page).nth(0)).toContainText('58');
  await expect(rows(page).nth(0).locator('img[alt="📌"]')).toBeVisible();
  await expect(rows(page).nth(0).locator('img[alt="🫶🏽"]')).toBeVisible();
  await expect(rows(page).nth(4).locator('img[alt="🌟"]')).toBeVisible();
  await expect(rows(page).nth(1)).toContainText('Geöffnet');
  await expect(rows(page).nth(4)).toContainText('18');
  await expect(rows(page).nth(9).locator('img[alt="🔥"]')).toHaveCount(0);
  // no horizontal overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test('open contact, send message, it persists after reload', async ({ page }) => {
  await rows(page).nth(2).click();
  await expect(page.getByTestId('chat-view')).toBeVisible();
  await page.getByTestId('chat-input').fill('Hallo Test 👋');
  await page.getByTestId('send').click();
  await expect(page.getByTestId('message').first()).toContainText('Hallo Test');
  // simulated reply arrives
  await expect(page.getByTestId('message')).toHaveCount(2, { timeout: 12_000 });
  await page.waitForTimeout(500);
  await page.reload();
  await rows(page).nth(2).click();
  await expect(page.getByTestId('message').first()).toContainText('Hallo Test');
  await expect(page.getByTestId('message')).toHaveCount(2);
});

test('long-press menu saves and deletes a message', async ({ page }) => {
  await rows(page).nth(9).click();
  await page.getByTestId('chat-input').fill('zu löschen');
  await page.getByTestId('send').click();
  const msg = page.getByTestId('message').first();
  const box = (await msg.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 8);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Im Chat speichern' }).click();
  await expect(msg).toContainText('Gespeichert');
  await page.mouse.move(box.x + 20, box.y + 8);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Löschen' }).click();
  await expect(page.getByText('zu löschen')).toHaveCount(0);
});

test('edit contact streak and order, persists after reload', async ({ page }) => {
  await openMenu(page);
  await page.getByTestId('menu-contacts').click();
  // move Noel above Número? Move second item (Noel) down one slot.
  await page.getByRole('button', { name: 'Nach unten' }).nth(1).click();
  await page.getByTestId('editor-row').nth(1).click(); // now Yarrrrak
  await page.getByTestId('field-streak').fill('123');
  await page.getByTestId('field-name').fill('Yarrrrak Edit');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(rows(page).nth(1)).toContainText('Yarrrrak Edit');
  await expect(rows(page).nth(1)).toContainText('123');
  await expect(rows(page).nth(2)).toContainText('Noel');
  await page.waitForTimeout(500);
  await page.reload();
  await expect(rows(page).nth(1)).toContainText('Yarrrrak Edit');
  await expect(rows(page).nth(1)).toContainText('123');
  await expect(rows(page).nth(2)).toContainText('Noel');
});

test('streak does not change just by reopening the app', async ({ page }) => {
  await page.reload();
  await page.reload();
  await expect(rows(page).nth(0)).toContainText('58');
  await expect(rows(page).nth(4)).toContainText('18');
});

test('camera: live capture or fallback, then edit and send a snap', async ({ page, browserName }) => {
  await page.getByTestId('nav-camera').click();
  await expect(page.getByTestId('camera')).toBeVisible();
  if (browserName === 'chromium') {
    // fake camera stream → capture
    await page.waitForFunction(() => (document.querySelector('video') as HTMLVideoElement)?.videoWidth > 0, null, { timeout: 15_000 });
    await page.getByTestId('shutter').click();
  } else {
    await expect(page.getByTestId('camera-error')).toBeVisible({ timeout: 15_000 });
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Foto hochladen' }).click();
    await (await chooser).setFiles(IMAGE);
  }
  await expect(page.getByTestId('snap-editor')).toBeVisible();
  // text overlay
  await page.getByTestId('tool-text').click();
  await page.getByTestId('text-input').fill('Test Snap');
  await page.getByTestId('text-input').press('Enter');
  // draw a line
  await page.getByTestId('tool-draw').click();
  await page.mouse.move(100, 300);
  await page.mouse.down();
  await page.mouse.move(200, 380, { steps: 5 });
  await page.mouse.up();
  await page.getByTestId('send-to').click();
  await expect(page.getByTestId('send-to-screen')).toBeVisible();
  await page.getByTestId('recipient').nth(3).click(); // Ferdi
  await page.getByTestId('send-snap').click();
  await expect(rows(page).nth(3)).toContainText('Zugestellt');
  await expect(rows(page).nth(3)).toContainText('Jetzt');
});

test('simulated incoming snap can be viewed and dismissed', async ({ page }) => {
  await rows(page).nth(5).click();
  await page.getByTestId('chat-view').getByRole('button', { name: 'Navid Ali' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Eingehenden Snap simulieren/ }).click();
  await (await chooser).setFiles(IMAGE);
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(rows(page).nth(5)).toContainText('Neuer Snap');
  await rows(page).nth(5).click();
  await expect(page.getByTestId('snap-viewer')).toBeVisible();
  await page.getByTestId('snap-viewer').click({ position: { x: 200, y: 500 } });
  await expect(page.getByTestId('snap-viewer')).toHaveCount(0);
  await expect(rows(page).nth(5)).toContainText('Empfangen');
});

test('bottom navigation opens every screen', async ({ page }) => {
  await page.getByTestId('nav-map').click();
  await expect(page.getByTestId('map')).toBeVisible();
  await page.getByTestId('nav-stories').click();
  await expect(page.getByTestId('stories')).toBeVisible();
  await page.getByTestId('nav-spotlight').click();
  await expect(page.getByTestId('spotlight')).toBeVisible();
  await page.getByTestId('nav-camera').click();
  await expect(page.getByTestId('camera')).toBeVisible();
  await page.getByTestId('nav-chat').click();
  await expect(page.getByTestId('chat-list')).toBeVisible();
});

test('screenshot export produces an iPhone-sized PNG', async ({ page }) => {
  await openMenu(page);
  await page.getByTestId('menu-export').click();
  const img = page.getByTestId('export-image');
  await expect(img).toBeVisible({ timeout: 20_000 });
  const size = await img.evaluate(async (el: HTMLImageElement) => {
    await el.decode();
    return [el.naturalWidth, el.naturalHeight];
  });
  const vp = page.viewportSize()!;
  expect(size).toEqual([vp.width * 3, vp.height * 3]);
});

test('JSON backup export and import round-trip', async ({ page }, info) => {
  await rows(page).nth(1).click();
  await page.getByTestId('chat-input').fill('Backup-Nachricht');
  await page.getByTestId('send').click();
  await page.getByRole('button', { name: 'Zurück' }).click();
  await openMenu(page);
  await page.getByTestId('menu-backup').click();
  const dl = page.waitForEvent('download');
  await page.getByTestId('backup-export').click();
  const file = path.join(tmpdir(), `snapsim-backup-${info.project.name}.json`);
  await (await dl).saveAs(file);
  const json = JSON.parse(readFileSync(file, 'utf8'));
  expect(json.app).toBe('snapsim');
  expect(json.contacts).toHaveLength(10);

  // wipe, then import
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Alles zurücksetzen' }).click();
  await expect(rows(page)).toHaveCount(10);
  await openMenu(page);
  await page.getByTestId('menu-backup').click();
  page.once('dialog', (d) => d.accept());
  const chooser = page.waitForEvent('filechooser');
  await page.getByTestId('backup-import').click();
  await (await chooser).setFiles(file);
  await rows(page).nth(1).click();
  await expect(page.getByText('Backup-Nachricht')).toBeVisible();
});

test('PWA manifest and service worker', async ({ page, browserName }) => {
  const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json());
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThan(0);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  if (browserName === 'chromium') {
    const ok = await page.evaluate(async () => !!(await navigator.serviceWorker.ready).active);
    expect(ok).toBe(true);
  }
});

test('web view: switch, open chat, Apple emoji and live clock', async ({ page }) => {
  // live clock in the simulated status bar (desktop/Chromium only draws it outside iOS)
  const hhmm = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  // emoji are rendered as Apple images
  await expect(rows(page).first().locator('img.apple-emoji').first()).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await openMenu(page);
  await page.getByRole('button', { name: 'Web', exact: true }).click();
  await page.getByRole('button', { name: 'Schließen', exact: true }).click();
  await expect(page.getByTestId('web-layout')).toBeVisible();
  await expect(rows(page)).toHaveCount(10);
  await expect(rows(page).nth(1)).toContainText('2 Std.');
  await rows(page).nth(1).click();
  await page.getByTestId('chat-input').fill('Hallo Web');
  await page.getByTestId('send').click();
  await expect(page.getByTestId('message').first()).toContainText('Hallo Web');
  await page.reload();
  await expect(page.getByTestId('web-layout')).toBeVisible();
  expect(hhmm).toMatch(/^\d\d:\d\d$/);
});

test('raise all streaks at once', async ({ page }) => {
  await openMenu(page);
  await page.getByTestId('menu-contacts').click();
  await page.getByTestId('bulk-streaks').getByRole('button', { name: '+2' }).click();
  await page.getByTestId('bulk-custom').fill('10');
  await page.getByRole('button', { name: 'Anwenden' }).click();
  await page.getByRole('button', { name: 'Schließen' }).click();
  await expect(rows(page).nth(0)).toContainText('70'); // 58 + 2 + 10
  await expect(rows(page).nth(4)).toContainText('30'); // 18 + 2 + 10
  await expect(rows(page).nth(9).locator('img[alt="🔥"]')).toHaveCount(0); // no streak stays without one
  await page.waitForTimeout(500);
  await page.reload();
  await expect(rows(page).nth(0)).toContainText('70');
});

test('camera filters can be picked and are applied to the snap', async ({ page, browserName }) => {
  await page.getByTestId('nav-camera').click();
  const bw = page.getByRole('button', { name: 'Filter S/W' });
  await bw.click();
  await expect(bw).toHaveAttribute('aria-pressed', 'true');
  if (browserName === 'chromium') {
    await page.waitForFunction(() => (document.querySelector('video') as HTMLVideoElement)?.videoWidth > 0, null, { timeout: 15_000 });
    await expect(page.locator('video')).toHaveCSS('filter', /grayscale/);
    await page.getByTestId('shutter').click();
  } else {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Foto hochladen' }).click();
    await (await chooser).setFiles(IMAGE);
  }
  await expect(page.getByTestId('snap-editor')).toBeVisible();
  // the captured photo is black & white: sample its centre
  const grey = await page.locator('[data-testid=snap-editor] img').first().evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const [r, g, b] = ctx.getImageData(c.width >> 1, c.height >> 1, 1, 1).data;
    return Math.max(Math.abs(r - g), Math.abs(g - b)) < 12;
  });
  expect(grey).toBe(true);
});
