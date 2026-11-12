# Window Presets (KWin script)

Global shortcuts that snap the active window to fixed geometries, for KDE Plasma 6
on Wayland and X11. Coordinates are **global**, so one preset can span or straddle
several monitors.

When a shortcut fires, the script does the following to the active window. Panels,
docks, dialogs and other non-normal windows are skipped.

1. Turns off fullscreen.
2. Unmaximizes it.
3. Sets its frame geometry (including decorations) to the preset.

There are three kinds of actions:

- **Custom presets** use literal coordinates that you write or capture.
- **Generated layouts** are worked out from your monitor layout, with no coordinates
  to write.
- **Capture** copies the active window's geometry as a preset line.

## Custom presets

Presets live in the script's config, so you can change them without rebuilding. Use one
line per preset:

```
# name | shortcut | x,y,width,height
Span DP-2 + HDMI-A-1 | Meta+Ctrl+Alt+S | 0,0,3072,864
Centre on DP-2/HDMI-A-1 seam | Meta+Ctrl+Alt+C | 768,0,1536,864
```

- Lines starting with `#` and blank lines are ignored. Invalid lines are skipped and
  logged (see [Debugging](#debugging)).
- The shortcut field can be empty. The action is registered without a key, and you can
  bind one later in System Settings.
- The preset name is also the shortcut's identity in System Settings, so keep names
  unique.

These are the two shipped examples, based on this machine's layout. There are three
1920×1080 outputs at 125 % scale, so each one is 1536×864 logical:

| Output   | Geometry (logical) |
|----------|--------------------|
| DP-2     | `0,0 1536x864`     |
| HDMI-A-1 | `1536,0 1536x864`  |
| DP-1     | `3072,0 1536x864`  |

- **Span DP-2 + HDMI-A-1** covers the left and middle screens: `0,0,3072,864`.
- **Centre on DP-2/HDMI-A-1 seam** is one screen wide and centred on the seam at
  x=1536: `768,0,1536,864`.

The heights cover the full output, so a window also covers a panel on that screen. A
maximized window here gets a work area of 1536×824. Use `824` as the height if you
want to keep the panel visible.

### Editing presets

You can edit presets in either of these places:

- **System Settings → Window Management → KWin Scripts → Window Presets → configure
  (⚙)**: a multi-line text field.
- `~/.config/kwinrc`, which is the same value:
  ```sh
  kwriteconfig6 --file kwinrc --group Script-window-presets --key Presets \
    "$(printf 'Span | Meta+Ctrl+Alt+S | 0,0,3072,864\nSeam | Meta+Ctrl+Alt+C | 768,0,1536,864')"
  ```
  If the key is unset or empty, the built-in defaults are used. The built-in defaults
  are in `src/presets.ts` and mirror `package/contents/config/main.xml`.

> **Changing presets needs a reload.** Shortcuts are registered once, when the script
> loads. After editing, run `pnpm reload`, untick and re-tick the script in KWin Scripts
> and click Apply, or log out and back in.

When you rename or remove a preset, its old action stays in System Settings → Shortcuts →
KWin. Remove it with:

```sh
qdbus6 org.kde.kglobalaccel /kglobalaccel org.kde.KGlobalAccel.unregister kwin "Window Presets: <old name>"
```

## Generated layouts

Use the checkboxes in the script's settings page to choose which layouts exist. All
of them are on by default:

| Setting (kwinrc key)        | Actions created (on this machine)                                   |
|-----------------------------|---------------------------------------------------------------------|
| Span all screens (`AutoSpanAll`) | `Auto: Span all screens`                                       |
| Span neighbouring pairs (`AutoSpanPairs`) | `Auto: Span DP-2 + HDMI-A-1`, `Auto: Span HDMI-A-1 + DP-1` |
| Centre on seams (`AutoSeams`) | `Auto: Centre on DP-2/HDMI-A-1 seam`, `Auto: Centre on HDMI-A-1/DP-1 seam` |
| Desktop halves (`AutoHalves`) | `Auto: Desktop half 1 of 2`, `… 2 of 2`                       |
| Desktop thirds (`AutoThirds`) | `Auto: Desktop third 1 of 3` … `3 of 3`                       |
| Keep clear of panels (`AutoUseWorkArea`) | Changes the geometry of all of the above (see below) |

- **No default keys.** Generated actions start without shortcuts. Bind the ones you
  want in System Settings → Shortcuts → KWin.
- **Geometry is computed when the key is pressed.** It's worked out from the outputs'
  current positions, so moving or rescaling a monitor needs no reload. Adding or
  removing a monitor does need a reload, because that changes which actions exist.
  An action whose monitor is missing does nothing.
- **Neighbours** are monitors that share an edge, side by side or stacked. Seam
  layouts are as wide as the narrower of the two screens and centred on the shared
  edge. A vertical stack gets the same treatment rotated.
- **Halves and thirds** split the bounding box of all screens along its longer side.
- **Keep clear of panels** pulls each edge in by any panel on a screen touching that
  edge. On this machine that gives a height of 824 instead of 864. Custom presets
  always use their exact coordinates.

## Capturing a window's geometry

Size and place a window by hand, then press **Meta+Ctrl+Alt+G** (*Capture active
window geometry*). This does three things:

1. Copies a line like `XTerm | | 3072,0,1536,824` to the clipboard. This goes through
   Klipper, so Plasma's clipboard applet must be running.
2. Shows `Copied preset: 3072,0,1536,824` in the Plasma on-screen display.
3. Logs the line to the journal.

To turn it into a preset, paste the line into the Custom presets field, rename it, add
a shortcut, and reload.

A KWin script can't write its own config, so the paste step can't be automated.

## Finding coordinates

- **The easy way:** use [capture](#capturing-a-windows-geometry).

- **Monitor layout:** `kscreen-doctor -o` shows each output's `Geometry: x,y WxH`. These
  are logical (scaled) pixels, the same space KWin scripts use.
- **An existing window's geometry:** run `qdbus6 org.kde.KWin /KWin queryWindowInfo`,
  then click a window. It prints `x`, `y`, `width` and `height`, among other things.
  Those are the frame geometry, so you can paste them straight into a preset. Use
  `qdbus` instead of `qdbus6` if that's what your distro ships.

## Install from the KDE Store

System Settings → Window Management → KWin Scripts → *Get New…*, search for
*Window Presets*. Then enable it as described below.

## Build and install

Requirements: Node, pnpm, and `kpackagetool6`/`qdbus6` (shipped with Plasma 6).

```sh
pnpm install
pnpm build            # src/*.ts -> package/contents/code/main.js (single IIFE, ES2016)
pnpm install-script   # kpackagetool6 -i, or -u if already installed
```

`install-script` installs to `~/.local/share/kwin/scripts/window-presets/`.

**Enable it** under System Settings → Window Management → KWin Scripts by ticking
*Window Presets* and clicking Apply. The command-line equivalent is:

```sh
kwriteconfig6 --file kwinrc --group Plugins --key window-presetsEnabled true
pnpm reload
```

**Rebind shortcuts** under System Settings → Shortcuts → KWin. Search for "Window Presets".
The default keys are `Meta+Ctrl+Alt+S` and `Meta+Ctrl+Alt+C` for the two example
presets, and `Meta+Ctrl+Alt+G` for capture. `Meta+Ctrl+S` would
clash with Power Management's Sleep. KWin doesn't record the script's keys as the
action's "default", so "Reset to default" in that page clears them. Run `pnpm reload`
to get them back.

### Dev loop

```sh
pnpm build && pnpm install-script && pnpm reload
```

`pnpm reload` uses D-Bus and doesn't log you out:

1. `org.kde.kwin.Scripting.unloadScript window-presets` stops the running instance.
2. `org.kde.kwin.Scripting.start` loads every enabled script that isn't running, which
   picks up the newly installed package and the current config.

This only works while the script is enabled in kwinrc. The reload script warns you if
it isn't.

### Debugging

The script logs to KWin's journal:

```sh
journalctl --user -f | grep window-presets
# window-presets: registered 2 preset(s): Span DP-2 + HDMI-A-1, Centre on DP-2/HDMI-A-1 seam
```

Check which actions are registered:

```sh
qdbus6 org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.shortcutNames | grep "Window Presets"
```

Fire one without the keyboard (it acts on the currently active window):

```sh
qdbus6 org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.invokeShortcut "Window Presets: Span DP-2 + HDMI-A-1"
```

## Releasing to the KDE Store

1. Bump `version` in `package.json` **and** `KPlugin.Version` in `package/metadata.json`
   (`pnpm dist` refuses to pack if they differ).
2. `pnpm dist` builds and writes `window-presets.kwinscript` (a zip of `package/`).
3. Optionally check it: `kpackagetool6 --type=KWin/Script -u window-presets.kwinscript`.
4. Upload it on store.kde.org (category *KWin Scripts*).
5. Tag the release: `jj tag set v<version> -r @-` (or the released revision).

## Layout

```
src/main.ts          entry: reads config, registers shortcuts, applies geometry
src/presets.ts       default custom presets + line parser
src/auto.ts          generated layouts (span all/pairs, seams, halves, thirds)
src/geometry.ts      rect maths, output adjacency, panel-aware spans
src/capture.ts       capture shortcut (Klipper + Plasma OSD over D-Bus)
src/globals.d.ts     KWin globals (workspace, readConfig, registerShortcut, callDBus, print)
package/             the KPackage that gets installed
  metadata.json
  contents/code/main.js     build output (not tracked; `pnpm build` creates it)
  contents/config/main.xml  config schema (Presets: String, Auto*: Bool)
  contents/ui/config.ui     config dialog (presets text field + layout checkboxes)
scripts/             install.sh / reload.sh / dist.sh used by pnpm scripts
```

Types come from [`kwin-api`](https://github.com/zeroxoneafour/kwin-api), the
maintained KWin 6 bindings used by Polonium. It only ships interfaces, so
`src/globals.d.ts` declares the injected globals. esbuild bundles to a single IIFE
targeting ES2016. That's the ECMAScript level Qt 6's JS engine officially supports
("ECMAScript 7"), and the bundle has no imports and no Node APIs at runtime.
