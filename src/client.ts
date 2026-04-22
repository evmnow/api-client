import type { EvmNowApiOptions } from './types.js'

export class EvmNowApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response: unknown,
  ) {
    super(message)
    this.name = 'EvmNowApiError'
  }
}

export interface ApiClient {
  get<T>(
    path: string,
    query?: Record<string, string | boolean | undefined>,
  ): Promise<T>
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | boolean | undefined>,
) {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url
}

function getErrorMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as { errors?: { message?: string }[] }).errors
    const message = errors?.[0]?.message
    if (message) return message
  }

  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return fallback
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text)
}

export function createApiClient(options: EvmNowApiOptions): ApiClient {
  const fetcher = options.fetch ?? globalThis.fetch
  if (!fetcher) throw new Error('No fetch implementation available')

  const baseUrl = options.baseUrl ?? 'https://api.evm.now'

  return {
    async get<T>(
      path: string,
      query?: Record<string, string | boolean | undefined>,
    ) {
      const response = await fetcher(buildUrl(baseUrl, path, query), {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${options.key}`,
        },
      })
      const body = await readJson(response)

      if (!response.ok) {
        throw new EvmNowApiError(
          getErrorMessage(
            body,
            `EVM Now API request failed with ${response.status}`,
          ),
          response.status,
          body,
        )
      }

      if (body && typeof body === 'object' && 'data' in body) {
        return (body as { data: T }).data
      }

      return body as T
    },
  }
}
