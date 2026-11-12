import { roundRect } from "./geometry.ts";

const ICON = "preferences-system-windows-move";

/**
 * Copies a ready-to-paste preset line for the active window to the clipboard
 * (via Klipper) and shows it in the Plasma OSD. Also logged to the journal.
 */
export function captureActiveWindow(): void {
  const win = workspace.activeWindow;
  if (!win) return;
  const g = roundRect(win.frameGeometry);
  const coords = `${g.x},${g.y},${g.width},${g.height}`;
  const line = `${win.resourceClass || "Window"} | | ${coords}`;

  callDBus("org.kde.klipper", "/klipper", "org.kde.klipper.klipper", "setClipboardContents", line);
  callDBus("org.kde.plasmashell", "/org/kde/osdService", "org.kde.osdService", "showText", ICON, `Copied preset: ${coords}`);
  print(`window-presets: captured: ${line}`);
}
