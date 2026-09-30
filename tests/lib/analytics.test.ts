import { beforeEach, describe, expect, it, vi } from 'vitest'

const track = vi.hoisted(() => vi.fn())
vi.mock('@vercel/analytics', () => ({ track }))

const { trackEvent } = await import('@/lib/analytics')

beforeEach(() => {
  track.mockReset()
})

describe('trackEvent', () => {
  it('forwards the event name and properties', () => {
    trackEvent('export', { kind: 'combined', format: 'png' })
    expect(track).toHaveBeenCalledWith('export', { kind: 'combined', format: 'png' })
  })

  it('never throws when the analytics call fails (ad blockers, SSR)', () => {
    track.mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => trackEvent('images_added', { count: 2 })).not.toThrow()
  })
})
