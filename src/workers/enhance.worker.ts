import { applyEnhance, type Enhance } from '@/lib/enhance'

export interface EnhanceRequest {
  id: number
  buffer: ArrayBuffer
  width: number
  height: number
  params: Enhance
}

export interface EnhanceResponse {
  id: number
  buffer: ArrayBuffer
}

const scope = self as unknown as { postMessage(message: EnhanceResponse, transfer: Transferable[]): void }

self.addEventListener('message', (e: MessageEvent<EnhanceRequest>) => {
  const { id, buffer, width, height, params } = e.data
  const data = new Uint8ClampedArray(buffer)
  applyEnhance(data, width, height, params)
  scope.postMessage({ id, buffer }, [buffer])
})
