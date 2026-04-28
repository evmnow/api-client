#!/usr/bin/env node

import { EvmNowApiError, evmNowApi } from '@evmnow/api-client'

const args = process.argv.slice(2).filter((arg) => arg !== '--')
const [contractAddressArg, tokenIdArg] = args

const apiKey = process.env.EVM_NOW_API_KEY
const contractAddress = contractAddressArg ?? process.env.TOKEN_CONTRACT_ADDRESS
const tokenId = tokenIdArg ?? process.env.TOKEN_ID

if (!apiKey) {
  printUsage('Missing EVM_NOW_API_KEY. Copy .env.example to .env and set it.')
  process.exit(1)
}

if (!contractAddress || !tokenId) {
  printUsage('Missing token contract address or token ID.')
  process.exit(1)
}

const api = evmNowApi({ key: apiKey })

try {
  const token = await api.token.metadata(contractAddress, tokenId, {
    onPending: () => {
      console.error('Token metadata is pending. Waiting for the API to finish.')
    },
  })

  console.log(JSON.stringify(token, null, 2))
} catch (error) {
  if (error instanceof EvmNowApiError) {
    const status = error.status ? ` (${error.status})` : ''
    console.error(`EVM Now API error${status}: ${error.message}`)
    process.exit(1)
  }

  throw error
}

function printUsage(message) {
  console.error(message)
  console.error(
    'Usage: node --env-file=.env examples/fetch-token-metadata.js <contractAddress> <tokenId>',
  )
}
