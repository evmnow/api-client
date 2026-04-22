import type { ApiClient } from './client.js'
import type {
  TokenImageOptions,
  TokenImageResponseResult,
  TokenImageResult,
} from './types.js'

export interface TokenApi {
  image(
    contractAddress: string,
    tokenId: string | number | bigint,
    options?: TokenImageOptions,
  ): Promise<TokenImageResult>
}

export function createTokenApi(client: ApiClient): TokenApi {
  function imageUrl(key: string, size: string) {
    return `https://cdn.evm.now/tokens/${key}_${size}.webp`
  }

  function withImageUrls(token: TokenImageResponseResult): TokenImageResult {
    if (!token.image) return token

    const image: NonNullable<TokenImageResult['image']> = { ...token.image }
    for (const size of token.image.sizes) {
      image[size] = imageUrl(token.image.key, size)
    }

    return { ...token, image }
  }

  return {
    async image(contractAddress, tokenId, options = {}) {
      const token = await client.get<TokenImageResponseResult>(
        `/tokens/${contractAddress}/${tokenId.toString()}`,
        { refresh: options.refresh || undefined },
      )
      return withImageUrls(token)
    },
  }
}
