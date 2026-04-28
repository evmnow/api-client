---
'@evmnow/api-client': minor
---

Handle the async-queue metadata response. The token metadata endpoint now returns a `{ status: 'ready' | 'pending' | 'error', data }` envelope and can defer image caching to a background job. `api.token.metadata()` now polls until the image is ready (default: every 2.5s, up to 60s) and resolves with the fully cached metadata. New options: `pollIntervalMs`, `maxWaitMs`, `signal`, and `onPending` (fires with partial data on each pending response). New `EvmNowMetadataPendingError` is thrown when polling exhausts `maxWaitMs`, with the last partial `TokenMetadata` on `.lastData`. Server `status: 'error'` responses throw `EvmNowApiError` with the server's error message. The legacy `{ data: T }` envelope auto-unwrap has been removed.
