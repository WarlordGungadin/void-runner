# Decode DRAFT GLBs

GitHub chat tooling could not push raw binary `.glb`. These `.glb.b64` files are standard base64.

```bash
cd assets/ships
base64 -d needle.glb.b64 > needle.glb
base64 -d wake.glb.b64 > wake.glb
base64 -d anvil.glb.b64 > anvil.glb
base64 -d choir.glb.b64 > choir.glb
```

Or tell SuperGrok: decode each `assets/ships/*.glb.b64` to `assets/ships/*.glb` then load those paths in the hangar WebGL stage.
