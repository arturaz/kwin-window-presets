#!/bin/sh
# Install the KWin script package, or upgrade it if it is already installed.
set -e
cd "$(dirname "$0")/.."
if kpackagetool6 --type=KWin/Script --list 2>/dev/null | grep -qx 'window-presets'; then
  kpackagetool6 --type=KWin/Script -u package
else
  kpackagetool6 --type=KWin/Script -i package
fi
