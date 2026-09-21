#!/usr/bin/env bash
# Decode draft hangar ship GLBs from base64 text files.
# Run from repo root: bash assets/ships/decode-glbs.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
for name in needle wake anvil choir; do
  src="$DIR/${name}.glb.b64"
  dst="$DIR/${name}.glb"
  if [[ ! -f "$src" ]]; then
    echo "missing: $src" >&2
    exit 1
  fi
  base64 -d < "$src" > "$dst"
  echo "decoded $src -> $dst ($(wc -c < "$dst") bytes)"
done
