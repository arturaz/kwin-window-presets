#!/bin/sh
# Reload window-presets in the running KWin (Wayland or X11) without logging out.
# unloadScript drops the running instance; start() then loads every script that
# is enabled in kwinrc [Plugins] and not running, which picks up the freshly
# installed package and the current config.
set -e
ID=window-presets
QDBUS=$(command -v qdbus6 || command -v qdbus)

if [ "$(kreadconfig6 --file kwinrc --group Plugins --key "${ID}Enabled")" != "true" ]; then
  echo "warning: ${ID} is not enabled in kwinrc [Plugins]; enable it in System Settings ->" >&2
  echo "         Window Management -> KWin Scripts (or: kwriteconfig6 --file kwinrc --group Plugins --key ${ID}Enabled true)" >&2
fi

"$QDBUS" org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript "$ID" >/dev/null
"$QDBUS" org.kde.KWin /Scripting org.kde.kwin.Scripting.start
if [ "$("$QDBUS" org.kde.KWin /Scripting org.kde.kwin.Scripting.isScriptLoaded "$ID")" = "true" ]; then
  echo "${ID} reloaded"
else
  echo "${ID} is not loaded (is it installed and enabled?)" >&2
  exit 1
fi
