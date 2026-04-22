export type TokenImageSize = 'xs' | 'sm' | 'md' | 'lg'

export interface EvmNowApiOptions {
  key: string
  baseUrl?: string
  fetch?: typeof fetch
}

export interface TokenImageResponse {
  cdn: string
  sizes: TokenImageSize[]
  xs?: string
  sm?: string
  md?: string
  lg?: string
}

export type TokenImage = TokenImageResponse

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
