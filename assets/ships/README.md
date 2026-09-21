# Ship GLBs (HULLWAKE)

## wake.glb

**DRAFT** Meshy 6 Lite remesh ~32k tris; clay/no materials. Replace when Pro multi-view available.

SuperGrok should load `assets/ships/wake.glb` (bump `?v=` on cache bust).

Binary upload via GitHub MCP is not supported; mesh is stored as LZMA+base64 packparts. Decode:

```bash
cd assets/ships
cat packparts/wake-meshy-lite-lzma/*.part > wake.glb.lzma.b64
base64 -d wake.glb.lzma.b64 | xz -d -F lzma > wake.glb
# preferred sidecar:
base64 -w0 wake.glb > wake.glb.b64
# base64 -d wake.glb.b64 > wake.glb
```
