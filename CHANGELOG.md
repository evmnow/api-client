# @evmnow/api-client

## 0.3.1

### Patch Changes

- [`f3095e5`](https://github.com/evmnow/api-client/commit/f3095e51b45fae5899aaa8df74a88b91d613dfb4) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Expose `sourceAnimationUri` on token metadata responses when the API provides
  it.

## 0.3.0

### Minor Changes

- [`271cba9`](https://github.com/evmnow/api-client/commit/271cba94c9441bdbdb52ebd8825adca0b205f423) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Add `api.token.fetchMetadata()` for single-shot metadata requests. It
  makes exactly one HTTP call and returns a discriminated
  `TokenMetadataResponse` (`{ status: 'ready' | 'pending', data }`) — never
  throws on a pending response, and never polls. Useful when the caller
  wants to drive its own polling cadence (e.g. a frontend that polls a
  proxy endpoint and renders the partial `data.name` / `sourceImageUri`
  while waiting for the image cache).

  `metadata()` is now a thin polling wrapper around `fetchMetadata` and is
  fully backward-compatible.

  New public types: `TokenMetadataResponse`, `TokenMetadataFetchOptions`,
  `TokenApi`.

## 0.2.0

### Minor Changes

- [`6e3935c`](https://github.com/evmnow/api-client/commit/6e3935c2960e8deee8b65b13c520042de319fb99) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Handle the async-queue metadata response. The token metadata endpoint now returns a `{ status: 'ready' | 'pending' | 'error', data }` envelope and can defer image caching to a background job. `api.token.metadata()` now polls until the image is ready (default: every 2.5s, up to 60s) and resolves with the fully cached metadata. New options: `pollIntervalMs`, `maxWaitMs`, `signal`, and `onPending` (fires with partial data on each pending response). New `EvmNowMetadataPendingError` is thrown when polling exhausts `maxWaitMs`, with the last partial `TokenMetadata` on `.lastData`. Server `status: 'error'` responses throw `EvmNowApiError` with the server's error message. The legacy `{ data: T }` envelope auto-unwrap has been removed.

## 0.1.2

### Patch Changes

- [`a54c54b`](https://github.com/evmnow/api-client/commit/a54c54b56fccdf0c93d96fc358b556b2f8eecd56) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Reshape token metadata response. Renames `api.token.image()` to `api.token.metadata()`, exposes the original `tokenUri` and `sourceImageUri` from the on-chain metadata, and simplifies the `image` field to `{ xs?, sm?, md?, lg? }` with ready-to-use CDN URLs (the `key` and `sizes` wire fields are no longer surfaced).

## 0.1.1

### Patch Changes

- [`4b4813f`](https://github.com/evmnow/api-client/commit/4b4813fab10ee609c10872aab79966f8ef515cf4) Thanks [@yougogirldoteth](https://github.com/yougogirldoteth)! - Expand compact token image responses into CDN URLs for each available size. Token images now use the API response shape `{ key, sizes }`.
