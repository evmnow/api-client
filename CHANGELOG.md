# @evmnow/api-client

## 0.1.2

### Patch Changes

- [`a54c54b`](https://github.com/evmnow/api-client/commit/a54c54b56fccdf0c93d96fc358b556b2f8eecd56) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Reshape token metadata response. Renames `api.token.image()` to `api.token.metadata()`, exposes the original `tokenUri` and `sourceImageUri` from the on-chain metadata, and simplifies the `image` field to `{ xs?, sm?, md?, lg? }` with ready-to-use CDN URLs (the `key` and `sizes` wire fields are no longer surfaced).

## 0.1.1

### Patch Changes

- [`4b4813f`](https://github.com/evmnow/api-client/commit/4b4813fab10ee609c10872aab79966f8ef515cf4) Thanks [@yougogirldoteth](https://github.com/yougogirldoteth)! - Expand compact token image responses into CDN URLs for each available size. Token images now use the API response shape `{ key, sizes }`.
