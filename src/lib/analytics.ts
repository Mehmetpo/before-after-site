import { track } from '@vercel/analytics'
import type { Format, Mode } from '@/lib/compare-state'

// Privacy: events carry only coarse, non-identifying values. Never send file names, sizes or pixels.
interface Events {
  images_added: { count: number }
  compare_ready: Record<string, never>
  mode_change: { mode: Mode }
  export: { kind: 'combined' | 'snapshot'; format: Format }
}

export function trackEvent<K extends keyof Events>(name: K, props?: Events[K]) {
  try {
    track(name, props)
  } catch {
    // Analytics must never break the tool (blocked scripts, unsupported env).
  }
}
