---
'@evmnow/api-client': minor
---

Add `token.mint(contract, tokenId)` to resolve the true on-chain mint (first Transfer from the zero address) — `{ mintBlock, mintedAt, mintTxHash }`. Throws `EvmNowApiError` with `status === 404` when the contract is not an NFT or no mint is found.
