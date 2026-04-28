import { EvmNowApiError, type ApiClient } from './client.js'
import type {
  TokenImage,
  TokenImageSize,
  TokenMetadata,
  TokenMetadataFetchOptions,
  TokenMetadataOptions,
  TokenMetadataResponse,
} from './types.js'

interface TokenImageReadyWire {
  key: string
  sizes: TokenImageSize[]
}

interface TokenImagePendingWire {
  status: 'pending'
  key?: string
}

type TokenImageWire = TokenImageReadyWire | TokenImagePendingWire | null

interface TokenDataWire {
  name: string | null
  description: string | null
  tokenUri: string | null
  sourceImageUri: string | null
  image: TokenImageWire
}

type MetadataResponseWire =
  | { status: 'ready'; data: TokenDataWire }
  | { status: 'pending'; data: TokenDataWire }
  | { status: 'error'; data: null; error: string }

const DEFAULT_POLL_INTERVAL_MS = 2500
const DEFAULT_MAX_WAIT_MS = 60000

export class EvmNowMetadataPendingError extends EvmNowApiError {
  constructor(
    public lastData: TokenMetadata,
    public attempts: number,
  ) {
    super('Token metadata still pending', 0, lastData)
    this.name = 'EvmNowMetadataPendingError'
  }
}

export interface TokenApi {
  /**
   * Single-shot metadata request. Returns a discriminated union with the
   * server's `status` (`'ready'` or `'pending'`) and the current data.
   * Use this when you want to drive polling yourself (e.g. a frontend that
   * polls a proxy and renders the partial `data` while waiting).
   */
  fetchMetadata(
    contractAddress: string,
    tokenId: string | number | bigint,
    options?: TokenMetadataFetchOptions,
  ): Promise<TokenMetadataResponse>

  /**
   * Polls until the image is cached or `maxWaitMs` is exhausted. Throws
   * `EvmNowMetadataPendingError` (with the last partial on `.lastData`)
   * on timeout.
   */
  metadata(
    contractAddress: string,
    tokenId: string | number | bigint,
    options?: TokenMetadataOptions,
  ): Promise<TokenMetadata>
}

export function createTokenApi(client: ApiClient): TokenApi {
  function imageUrl(key: string, size: TokenImageSize) {
    return `https://cdn.evm.now/tokens/${key}_${size}.webp`
  }

  function expandImage(image: TokenImageWire): TokenImage | null {
    if (!image || !('sizes' in image)) return null
    const expanded: TokenImage = {}
    for (const size of image.sizes) {
      expanded[size] = imageUrl(image.key, size)
    }
    return expanded
  }

  function transform(data: TokenDataWire): TokenMetadata {
    return {
      name: data.name,
      description: data.description,
      tokenUri: data.tokenUri,
      sourceImageUri: data.sourceImageUri,
      image: expandImage(data.image),
    }
  }

  async function fetchMetadata(
    contractAddress: string,
    tokenId: string | number | bigint,
    options: TokenMetadataFetchOptions = {},
  ): Promise<TokenMetadataResponse> {
    throwIfAborted(options.signal)

    const path = `/tokens/${contractAddress}/${tokenId.toString()}`
    const query = { refresh: options.refresh || undefined }
    const wire = await client.get<MetadataResponseWire>(path, query)

    if (wire.status === 'error') {
      throw new EvmNowApiError(wire.error, 0, wire)
    }

    return { status: wire.status, data: transform(wire.data) }
  }

  return {
    fetchMetadata,

    async metadata(contractAddress, tokenId, options = {}) {
      const {
        refresh,
        pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
        maxWaitMs = DEFAULT_MAX_WAIT_MS,
        signal,
        onPending,
      } = options

      const start = Date.now()
      let attempts = 0

      while (true) {
        const response = await fetchMetadata(contractAddress, tokenId, {
          refresh,
          signal,
        })
        attempts++

        if (response.status === 'ready') return response.data

        onPending?.(response.data)

        const remaining = maxWaitMs - (Date.now() - start)
        if (remaining <= 0) {
          throw new EvmNowMetadataPendingError(response.data, attempts)
        }

        await sleep(Math.min(pollIntervalMs, remaining), signal)
      }
    },
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('Aborted', 'AbortError')
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
