import { evmNowApi } from '../src/index'
import { EvmNowApiError } from '../src/client'
import { EvmNowMetadataPendingError } from '../src/token'
import type { TokenMetadata } from '../src/types'

const CONTRACT = '0x0000000000000000000000000000000000000000'

const readyData = {
  name: 'Ready',
  description: 'desc',
  tokenUri: 'ipfs://t/1',
  sourceImageUri: 'ipfs://i/1.png',
  image: { key: 'cid', sizes: ['sm'] as const },
}

const pendingData = {
  name: 'Pending',
  description: 'desc',
  tokenUri: 'ipfs://t/1',
  sourceImageUri: 'ipfs://i/1.png',
  image: { status: 'pending' as const, key: 'cid' },
}

function queueResponses(...responses: unknown[]) {
  let index = 0
  const calls: { url: string }[] = []
  const fetcher = async (input: RequestInfo | URL) => {
    calls.push({ url: String(input) })
    const body = responses[Math.min(index, responses.length - 1)]
    index++
    return Response.json(body as object)
  }
  return { fetcher, calls, callCount: () => index }
}

describe('token.metadata', () => {
  it('returns ready data on first call when image is already cached', async () => {
    const { fetcher, callCount } = queueResponses({
      status: 'ready',
      data: readyData,
    })
    const api = evmNowApi({ key: 'k', fetch: fetcher })

    const token = await api.token.metadata(CONTRACT, 1)

    expect(callCount()).toBe(1)
    expect(token.name).toBe('Ready')
    expect(token.image).toEqual({
      sm: 'https://cdn.evm.now/tokens/cid_sm.webp',
    })
  })

  it('returns ready immediately when token has no image', async () => {
    const { fetcher, callCount } = queueResponses({
      status: 'ready',
      data: { ...readyData, sourceImageUri: null, image: null },
    })
    const api = evmNowApi({ key: 'k', fetch: fetcher })

    const token = await api.token.metadata(CONTRACT, 1)

    expect(callCount()).toBe(1)
    expect(token.image).toBeNull()
    expect(token.sourceImageUri).toBeNull()
  })

  it('polls until ready', async () => {
    const { fetcher, callCount } = queueResponses(
      { status: 'pending', data: pendingData },
      { status: 'pending', data: pendingData },
      { status: 'ready', data: readyData },
    )
    const api = evmNowApi({ key: 'k', fetch: fetcher })

    const token = await api.token.metadata(CONTRACT, 1, {
      pollIntervalMs: 5,
      maxWaitMs: 1000,
    })

    expect(callCount()).toBe(3)
    expect(token.name).toBe('Ready')
    expect(token.image).toEqual({
      sm: 'https://cdn.evm.now/tokens/cid_sm.webp',
    })
  })

  it('fires onPending with partial data on each pending response', async () => {
    const { fetcher } = queueResponses(
      { status: 'pending', data: pendingData },
      { status: 'pending', data: pendingData },
      { status: 'ready', data: readyData },
    )
    const api = evmNowApi({ key: 'k', fetch: fetcher })
    const partials: TokenMetadata[] = []

    await api.token.metadata(CONTRACT, 1, {
      pollIntervalMs: 5,
      maxWaitMs: 1000,
      onPending: (partial) => partials.push(partial),
    })

    expect(partials).toHaveLength(2)
    expect(partials[0]).toEqual({
      name: 'Pending',
      description: 'desc',
      tokenUri: 'ipfs://t/1',
      sourceImageUri: 'ipfs://i/1.png',
      image: null,
    })
  })

  it('throws EvmNowApiError when status is error', async () => {
    const { fetcher } = queueResponses({
      status: 'error',
      data: null,
      error: 'Token metadata does not include a static image',
    })
    const api = evmNowApi({ key: 'k', fetch: fetcher })

    await expect(api.token.metadata(CONTRACT, 1)).rejects.toMatchObject({
      name: 'EvmNowApiError',
      message: 'Token metadata does not include a static image',
      status: 0,
    } satisfies Partial<EvmNowApiError>)
  })

  it('throws EvmNowMetadataPendingError after maxWaitMs with last partial data', async () => {
    const { fetcher, callCount } = queueResponses({
      status: 'pending',
      data: pendingData,
    })
    const api = evmNowApi({ key: 'k', fetch: fetcher })

    let caught: unknown
    try {
      await api.token.metadata(CONTRACT, 1, {
        pollIntervalMs: 5,
        maxWaitMs: 20,
      })
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(EvmNowMetadataPendingError)
    const err = caught as EvmNowMetadataPendingError
    expect(err.attempts).toBeGreaterThanOrEqual(2)
    expect(err.lastData.name).toBe('Pending')
    expect(err.lastData.image).toBeNull()
    expect(callCount()).toBe(err.attempts)
  })

  it('throws immediately with maxWaitMs: 0 on pending', async () => {
    const { fetcher, callCount } = queueResponses({
      status: 'pending',
      data: pendingData,
    })
    const api = evmNowApi({ key: 'k', fetch: fetcher })

    let caught: unknown
    try {
      await api.token.metadata(CONTRACT, 1, { maxWaitMs: 0 })
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(EvmNowMetadataPendingError)
    expect((caught as EvmNowMetadataPendingError).attempts).toBe(1)
    expect(callCount()).toBe(1)
  })

  it('aborts before any fetch when signal is already aborted', async () => {
    const { fetcher, callCount } = queueResponses({
      status: 'ready',
      data: readyData,
    })
    const api = evmNowApi({ key: 'k', fetch: fetcher })
    const controller = new AbortController()
    controller.abort()

    await expect(
      api.token.metadata(CONTRACT, 1, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(callCount()).toBe(0)
  })

  it('aborts during the sleep between polls', async () => {
    const { fetcher, callCount } = queueResponses({
      status: 'pending',
      data: pendingData,
    })
    const api = evmNowApi({ key: 'k', fetch: fetcher })
    const controller = new AbortController()

    const promise = api.token.metadata(CONTRACT, 1, {
      pollIntervalMs: 5000,
      maxWaitMs: 60000,
      signal: controller.signal,
    })

    await new Promise((r) => setTimeout(r, 30))
    controller.abort()

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(callCount()).toBe(1)
  })

  it('propagates refresh on every poll attempt', async () => {
    const { fetcher, calls } = queueResponses(
      { status: 'pending', data: pendingData },
      { status: 'ready', data: readyData },
    )
    const api = evmNowApi({ key: 'k', fetch: fetcher })

    await api.token.metadata(CONTRACT, 1, {
      refresh: true,
      pollIntervalMs: 5,
      maxWaitMs: 1000,
    })

    expect(calls).toHaveLength(2)
    expect(calls[0].url).toContain('refresh=true')
    expect(calls[1].url).toContain('refresh=true')
  })

  it('honors custom pollIntervalMs', async () => {
    const { fetcher } = queueResponses(
      { status: 'pending', data: pendingData },
      { status: 'ready', data: readyData },
    )
    const api = evmNowApi({ key: 'k', fetch: fetcher })

    const start = Date.now()
    await api.token.metadata(CONTRACT, 1, {
      pollIntervalMs: 50,
      maxWaitMs: 1000,
    })
    const elapsed = Date.now() - start

    expect(elapsed).toBeGreaterThanOrEqual(45)
  })
})
