import type { ApiClient } from './client.js'
import type { TokenImageOptions, TokenImageResult } from './types.js'

export interface TokenApi {
  image(
    contractAddress: string,
    tokenId: string | number | bigint,
    options?: TokenImageOptions,
  ): Promise<TokenImageResult>
}

export function createTokenApi(client: ApiClient): TokenApi {
  return {
    async image(contractAddress, tokenId, options = {}) {
      return client.get<TokenImageResult>(
        `/tokens/${contractAddress}/${tokenId.toString()}`,
        { refresh: options.refresh || undefined },
      )
    },
  }
}
