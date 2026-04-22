export type TokenImageSize = 'xs' | 'sm' | 'md' | 'lg'

export interface EvmNowApiOptions {
  key: string
  baseUrl?: string
  fetch?: typeof fetch
}

export interface TokenImageResponse {
  key: string
  sizes: TokenImageSize[]
}

export type TokenImage = TokenImageResponse & {
  xs?: string
  sm?: string
  md?: string
  lg?: string
}

export interface TokenImageResponseResult {
  name: string | null
  description: string | null
  image: TokenImageResponse | null
}

export interface TokenImageResult {
  name: string | null
  description: string | null
  image: TokenImage | null
}

export interface TokenImageOptions {
  refresh?: boolean
}
