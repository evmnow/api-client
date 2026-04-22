import { createApiClient } from './client.js'
import { createTokenApi } from './token.js'
import type { EvmNowApiOptions } from './types.js'

export function evmNowApi(options: EvmNowApiOptions) {
  const client = createApiClient(options)

  return {
    token: createTokenApi(client),
  }
}

export { EvmNowApiError } from './client.js'
export type {
  EvmNowApiOptions,
  TokenImage,
  TokenImageOptions,
  TokenImageResponse,
  TokenImageResponseResult,
  TokenImageResult,
  TokenImageSize,
} from './types.js'
