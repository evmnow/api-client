import type { ApiClient } from './client.js'
import type {
  TokenImage,
  TokenImageSize,
  TokenMetadata,
  TokenMetadataOptions,
} from './types.js'

interface TokenImageWire {
  key: string
  sizes: TokenImageSize[]
}

interface TokenMetadataWire {
  name: string | null
  description: string | null
  tokenUri: string | null
  sourceImageUri: string | null
  image: TokenImageWire | null
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

  function expandImage(image: TokenImageWire | null): TokenImage | null {
    if (!image) return null
    const expanded: TokenImage = {}
    for (const size of image.sizes) {
      expanded[size] = imageUrl(image.key, size)
    }
    return expanded
  }

  return {
    async metadata(contractAddress, tokenId, options = {}) {
      const wire = await client.get<TokenMetadataWire>(
        `/tokens/${contractAddress}/${tokenId.toString()}`,
        { refresh: options.refresh || undefined },
      )
      return {
        name: wire.name,
        description: wire.description,
        tokenUri: wire.tokenUri,
        sourceImageUri: wire.sourceImageUri,
        image: expandImage(wire.image),
      }
    },
  }
}
