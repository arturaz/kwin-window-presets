import { buildAutoActions, type Action } from "./auto.ts";
import { captureActiveWindow } from "./capture.ts";
import { roundRect, type Rect } from "./geometry.ts";
import { DEFAULT_PRESETS, parsePresets } from "./presets.ts";

// Keep defaults in sync with package/contents/config/main.xml (readConfig doesn't see kcfg defaults).
const readBool = (key: string, def: boolean): boolean => {
  const v: unknown = readConfig(key, def);
  return v === true || v === "true";
};

function apply(rect: Rect | null): void {
  const win = workspace.activeWindow;
  if (!win || !win.normalWindow || !rect) return;

  if (win.fullScreen) win.fullScreen = false;
  win.setMaximize(false, false);
  win.frameGeometry = roundRect(rect);
}

const configured = String(readConfig("Presets", "")).trim();
const manual: Action[] = parsePresets(configured === "" ? DEFAULT_PRESETS : configured).map((p) => ({
  name: p.name,
  shortcut: p.shortcut,
  resolve: () => p,
}));

const auto = buildAutoActions({
  spanAll: readBool("AutoSpanAll", true),
  spanPairs: readBool("AutoSpanPairs", true),
  seams: readBool("AutoSeams", true),
  halves: readBool("AutoHalves", true),
  thirds: readBool("AutoThirds", true),
  useWorkArea: readBool("AutoUseWorkArea", true),
});

const seen: { [name: string]: true } = {};
const actions = manual.concat(auto).filter((a) => {
  if (seen[a.name]) {
    print(`window-presets: duplicate action name "${a.name}", skipping`);
    return false;
  }
  return (seen[a.name] = true);
});

for (const action of actions) {
  const id = `Window Presets: ${action.name}`;
  registerShortcut(id, id, action.shortcut, () => apply(action.resolve()));
}

const captureId = "Window Presets: Capture active window geometry";
registerShortcut(captureId, captureId, "Meta+Ctrl+Alt+G", captureActiveWindow);

print(`window-presets: registered ${actions.length} action(s): ${actions.map((a) => a.name).join(", ")}`);
