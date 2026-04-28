# @evmnow/api-client

```ts
import { evmNowApi } from '@evmnow/api-client'

const api = evmNowApi({ key: 'evm_now_key' })
const token = await api.token.metadata(
  '0x0000000000000000000000000000000000000000',
  '1',
)

console.log(token.name)
console.log(token.tokenUri)
console.log(token.sourceImageUri)
console.log(token.image?.sm)
```

## Async image caching

Token images are cached on a background queue. `metadata()` polls the API
until the image is ready (default: every 2.5s, up to 60s) and resolves
with the fully cached metadata.

```ts
const token = await api.token.metadata(contract, tokenId, {
  pollIntervalMs: 2500,
  maxWaitMs: 60_000,
  signal: controller.signal,
  onPending: (partial) => {
    // Render `partial.name` and `partial.sourceImageUri` while waiting.
    // `partial.image` is null until the cache catches up.
  },
})
```

Set `maxWaitMs: 0` to make a single request with no polling.

### Errors

- `EvmNowApiError` — thrown for HTTP errors and when the server returns
  `status: 'error'` (e.g. unresolvable metadata). The server's error
  message is on `.message`.
- `EvmNowMetadataPendingError` (extends `EvmNowApiError`) — thrown when
  polling exhausts `maxWaitMs`. The last partial `TokenMetadata` is on
  `.lastData` so you can still render `name` / `sourceImageUri`.

```ts
import {
  evmNowApi,
  EvmNowApiError,
  EvmNowMetadataPendingError,
} from '@evmnow/api-client'

try {
  const token = await api.token.metadata(contract, tokenId)
} catch (err) {
  if (err instanceof EvmNowMetadataPendingError) {
    // Image still caching — render with err.lastData and retry later.
  } else if (err instanceof EvmNowApiError) {
    // Server-side or HTTP error.
  }
}
```

## Examples

In a repository checkout, copy `.env.example` to `.env` and set
`EVM_NOW_API_KEY`.

```sh
pnpm example:fetch-token-metadata -- 0x3b3ee1931dc30c1957379fac9aba94d1c48a5405 77879
```

You can also set `TOKEN_CONTRACT_ADDRESS` and `TOKEN_ID` in `.env`, then run:

```sh
pnpm example:fetch-token-metadata
```
