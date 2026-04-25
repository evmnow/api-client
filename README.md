# @evmnow/api-client

```ts
import { evmNowApi } from '@evmnow/api-client'

const api = evmNowApi({ key: 'evm_now_key' })
const token = await api.token.metadata(
  '0x0000000000000000000000000000000000000000',
  '1',
)

console.log(token.name)
console.log(token.tokenUri)
console.log(token.sourceImageUri)
console.log(token.image?.sm)
```
