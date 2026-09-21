#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PARTS="$DIR/packparts/wake-meshy-lite-lzma"
cat "$PARTS"/*.part > "$DIR/wake.glb.lzma.b64"
base64 -d "$DIR/wake.glb.lzma.b64" | xz -d -F lzma > "$DIR/wake.glb"
base64 -w0 "$DIR/wake.glb" > "$DIR/wake.glb.b64"
echo "decoded $DIR/wake.glb ($(wc -c < "$DIR/wake.glb") bytes)"
