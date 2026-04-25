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
  image: TokenImage | null
}

export interface TokenMetadataOptions {
  refresh?: boolean
}
