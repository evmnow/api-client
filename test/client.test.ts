import { evmNowApi } from '../src/index'
import { EvmNowApiError } from '../src/client'

describe('evmNowApi', () => {
  it('requests token metadata and expands the cached image into CDN URLs', async () => {
    let requestedUrl: string | null = null
    let requestedAuthorization: string | null = null

    const api = evmNowApi({
      key: 'test-key',
      baseUrl: 'https://api.example.test/',
      fetch: async (input, init) => {
        requestedUrl = String(input)
        requestedAuthorization = new Headers(init?.headers).get('authorization')

        return Response.json({
          name: 'Token #1',
          description: 'Example token',
          tokenUri: 'ipfs://bafy.../1',
          sourceImageUri: 'ipfs://bafy.../1.png',
          image: {
            key: 'cid',
            sizes: ['sm'],
          },
        })
      },
    })

    const token = await api.token.metadata(
      '0x0000000000000000000000000000000000000000',
      1,
      {
        refresh: true,
      },
    )

    expect(requestedUrl).toBe(
      'https://api.example.test/tokens/0x0000000000000000000000000000000000000000/1?refresh=true',
    )
    expect(requestedAuthorization).toBe('Bearer test-key')
    expect(token).toEqual({
      name: 'Token #1',
      description: 'Example token',
      tokenUri: 'ipfs://bafy.../1',
      sourceImageUri: 'ipfs://bafy.../1.png',
      image: {
        sm: 'https://cdn.evm.now/tokens/cid_sm.webp',
      },
    })
  })

  it('unwraps legacy data envelopes when present', async () => {
    const api = evmNowApi({
      key: 'test-key',
      fetch: async () =>
        Response.json({
          data: {
            name: 'Wrapped token',
            description: null,
            tokenUri: null,
            sourceImageUri: null,
            image: null,
          },
        }),
    })

    await expect(
      api.token.metadata('0x0000000000000000000000000000000000000000', 1),
    ).resolves.toEqual({
      name: 'Wrapped token',
      description: null,
      tokenUri: null,
      sourceImageUri: null,
      image: null,
    })
  })

  it('throws API errors with the parsed response body', async () => {
    const api = evmNowApi({
      key: 'test-key',
      fetch: async () =>
        Response.json(
          {
            message: 'Unauthorized',
          },
          { status: 401 },
        ),
    })

    await expect(
      api.token.metadata('0x0000000000000000000000000000000000000000', 1),
    ).rejects.toMatchObject({
      name: 'EvmNowApiError',
      message: 'Unauthorized',
      status: 401,
      response: {
        message: 'Unauthorized',
      },
    } satisfies Partial<EvmNowApiError>)
  })
})
