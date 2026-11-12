export interface Preset {
  // x/y/width/height make a Preset usable as a Rect.
  name: string;
  shortcut: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Used when the "Presets" config key is empty/unset. Keep in sync with the
 * <default> in package/contents/config/main.xml.
 *
 * Output layout (kscreen-doctor -o, logical px, scale 1.25):
 *   DP-2     0,0    1536x864
 *   HDMI-A-1 1536,0 1536x864
 *   DP-1     3072,0 1536x864
 */
export const DEFAULT_PRESETS = [
  "# name | shortcut | x,y,width,height  (global logical coordinates)",
  "Span DP-2 + HDMI-A-1 | Meta+Ctrl+Alt+S | 0,0,3072,864",
  "Centre on DP-2/HDMI-A-1 seam | Meta+Ctrl+Alt+C | 768,0,1536,864",
].join("\n");

/**
 * Parses one preset per line: `Name | Shortcut | x,y,width,height`.
 * Blank lines and lines starting with `#` are ignored. Shortcut may be empty
 * (registered without a default key; bind it in System Settings).
 */
export function parsePresets(text: string): Preset[] {
  const presets: Preset[] = [];
  const seen: { [name: string]: true } = {};
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "" || line.charAt(0) === "#") continue;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length !== 3) {
      print(`window-presets: line ${i + 1}: expected "name | shortcut | x,y,w,h", got: ${line}`);
      continue;
    }
    const [name, shortcut, geom] = parts;
    const nums = geom.split(",").map((n) => Number(n.trim()));
    if (name === "" || nums.length !== 4 || nums.some((n) => !isFinite(n)) || nums[2] <= 0 || nums[3] <= 0) {
      print(`window-presets: line ${i + 1}: invalid name or geometry: ${line}`);
      continue;
    }
    if (seen[name]) {
      print(`window-presets: line ${i + 1}: duplicate preset name "${name}", skipping`);
      continue;
    }
    seen[name] = true;
    presets.push({ name, shortcut, x: nums[0], y: nums[1], width: nums[2], height: nums[3] });
  }
  return presets;
}
