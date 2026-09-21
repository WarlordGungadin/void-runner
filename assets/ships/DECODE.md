# Decode Wake hangar GLB

Binary `wake.glb` could not be pushed via GitHub chat tooling (Contents API text-only). Use the base64 sidecar:

```bash
cd assets/ships
# If split parts exist, assemble first:
# cat packparts/wake-meshy-lite/*.part > wake.glb.b64
base64 -d wake.glb.b64 > wake.glb
```

**DRAFT** Meshy 6 Lite remesh ~32k tris; clay/no materials. Replace when Pro multi-view available.

SuperGrok: load `assets/ships/wake.glb` and bump `?v=`.
