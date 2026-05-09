export type TokenImageSize = 'xs' | 'sm' | 'md' | 'lg'

export interface EvmNowApiOptions {
  key: string
  baseUrl?: string
  fetch?: typeof fetch
}

export type TokenImage = Partial<Record<TokenImageSize, string>>

export interface TokenMetadata {
  name: string | null
  description: string | null
  tokenUri: string | null
  sourceImageUri: string | null
  sourceAnimationUri: string | null
  image: TokenImage | null
}

export type TokenMetadataResponse =
  | { status: 'ready'; data: TokenMetadata }
  | { status: 'pending'; data: TokenMetadata }

export interface TokenMetadataFetchOptions {
  refresh?: boolean
  signal?: AbortSignal
}

export interface TokenMetadataOptions extends TokenMetadataFetchOptions {
  pollIntervalMs?: number
  maxWaitMs?: number
  onPending?: (partial: TokenMetadata) => void
}
