---
'@evmnow/api-client': minor
---

Add `api.token.fetchMetadata()` for single-shot metadata requests. It
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
