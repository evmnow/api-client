import { EvmNowApiError, type ApiClient } from './client.js'
import type {
  TokenImage,
  TokenImageSize,
  TokenMetadata,
  TokenMetadataOptions,
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

  return {
    async metadata(contractAddress, tokenId, options = {}) {
      const {
        refresh,
        pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
        maxWaitMs = DEFAULT_MAX_WAIT_MS,
        signal,
        onPending,
      } = options

      const path = `/tokens/${contractAddress}/${tokenId.toString()}`
      const query = { refresh: refresh || undefined }
      const start = Date.now()
      let attempts = 0

      while (true) {
        throwIfAborted(signal)

        const wire = await client.get<MetadataResponseWire>(path, query)
        attempts++

        if (wire.status === 'error') {
          throw new EvmNowApiError(wire.error, 0, wire)
        }

        const data = transform(wire.data)

        if (wire.status === 'ready') return data

        onPending?.(data)

        const remaining = maxWaitMs - (Date.now() - start)
        if (remaining <= 0) {
          throw new EvmNowMetadataPendingError(data, attempts)
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
