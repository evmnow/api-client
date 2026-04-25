---
'@evmnow/api-client': patch
---

Reshape token metadata response. Renames `api.token.image()` to `api.token.metadata()`, exposes the original `tokenUri` and `sourceImageUri` from the on-chain metadata, and simplifies the `image` field to `{ xs?, sm?, md?, lg? }` with ready-to-use CDN URLs (the `key` and `sizes` wire fields are no longer surfaced).
