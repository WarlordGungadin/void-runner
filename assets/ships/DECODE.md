# Decode Wake hangar GLB

GitHub chat tooling cannot push raw binary `.glb` (MCP Contents API is text-only; ~2.7MB payload too large for one shot).

## Assemble LZMA-compressed base64 parts → wake.glb

```bash
cd assets/ships
cat packparts/wake-meshy-lite-lzma/*.part > wake.glb.lzma.b64
base64 -d wake.glb.lzma.b64 | xz -d -F lzma > wake.glb
# optional sidecar:
base64 -w0 wake.glb > wake.glb.b64
# then: base64 -d wake.glb.b64 > wake.glb
```

Or: `bash assets/ships/decode-wake.sh`

**DRAFT** Meshy 6 Lite remesh ~32k tris; clay/no materials. Replace when Pro multi-view available.

SuperGrok should load `assets/ships/wake.glb` and bump `?v=`.

glb_sha256: 8e4cecd3a375a9735ff549acaf6603e72efb50f10b1ca4665b272ae0f615e429
