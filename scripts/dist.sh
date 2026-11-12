#!/bin/sh
# Build and pack window-presets.kwinscript for upload to the KDE Store.
# A .kwinscript is a zip of package/'s contents with metadata.json at the root.
set -e
cd "$(dirname "$0")/.."

PKG_VERSION=$(node -p 'require("./package.json").version')
META_VERSION=$(node -p 'require("./package/metadata.json").KPlugin.Version')
if [ "$PKG_VERSION" != "$META_VERSION" ]; then
  echo "error: version mismatch: package.json=$PKG_VERSION, package/metadata.json=$META_VERSION" >&2
  exit 1
fi

pnpm build
OUT=window-presets.kwinscript
rm -f "$OUT"
(cd package && zip -qr "../$OUT" .)
echo "wrote $OUT (version $PKG_VERSION)"
