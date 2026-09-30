import { describe, expect, it } from 'vitest'
import { initialState, reducer } from '@/lib/compare-state'

const img = (name: string) => ({ name }) as never

describe('compare-state reducer', () => {
  it('fills before then after when two images arrive', () => {
    const s = reducer(initialState, { type: 'images', images: [img('a'), img('b')] })
    expect(s.before?.name).toBe('a')
    expect(s.after?.name).toBe('b')
  })
  it('one image fills the first empty slot', () => {
    let s = reducer(initialState, { type: 'images', images: [img('a')] })
    expect(s.before?.name).toBe('a')
    s = reducer(s, { type: 'images', images: [img('b')] })
    expect(s.after?.name).toBe('b')
  })
  it('when both slots are full a single image replaces after', () => {
    let s = reducer(initialState, { type: 'images', images: [img('a'), img('b')] })
    s = reducer(s, { type: 'images', images: [img('c')] })
    expect(s.before?.name).toBe('a')
    expect(s.after?.name).toBe('c')
  })
  it('swaps', () => {
    let s = reducer(initialState, { type: 'images', images: [img('a'), img('b')] })
    s = reducer(s, { type: 'swap' })
    expect(s.before?.name).toBe('b')
    expect(s.after?.name).toBe('a')
  })
  it('clamps slider and opacity to 0..100', () => {
    let s = reducer(initialState, { type: 'set', key: 'sliderPct', value: 150 })
    expect(s.sliderPct).toBe(100)
    s = reducer(s, { type: 'set', key: 'fadeOpacity', value: -3 })
    expect(s.fadeOpacity).toBe(0)
  })
  it('zoom action keeps view valid; reset restores defaults', () => {
    let s = reducer(initialState, { type: 'zoom', factor: 100 })
    expect(s.view.zoom).toBe(8)
    s = reducer(s, { type: 'resetView' })
    expect(s.view.zoom).toBe(1)
  })
  it('sets adjust with clamping', () => {
    const s = reducer(initialState, { type: 'adjust', key: 'brightness', value: 999 })
    expect(s.adjust.brightness).toBe(200)
  })
  it('clear drops both images and resets the view but keeps mode and adjust', () => {
    let s = reducer(initialState, { type: 'images', images: [img('a'), img('b')] })
    s = reducer(s, { type: 'mode', mode: 'fade' })
    s = reducer(s, { type: 'zoom', factor: 2 })
    s = reducer(s, { type: 'clear' })
    expect(s.before).toBeNull()
    expect(s.after).toBeNull()
    expect(s.view).toEqual(initialState.view)
    expect(s.mode).toBe('fade')
  })
})

describe('enhance mode', () => {
  it('starts with one image as before and turns enhance mode on', () => {
    const s = reducer(initialState, { type: 'enhanceStart', image: img('a') })
    expect(s.before?.name).toBe('a')
    expect(s.after).toBeNull()
    expect(s.enhanceMode).toBe(true)
  })
  it('clamps enhance values and can reset them', () => {
    const start = reducer(initialState, { type: 'enhanceStart', image: img('a') })
    let s = reducer(start, { type: 'enhanceSet', key: 'exposure', value: 9 })
    expect(s.enhance.exposure).toBe(2)
    s = reducer(s, { type: 'enhanceSet', key: 'sharpen', value: 40 })
    s = reducer(s, { type: 'enhanceReset' })
    expect(s.enhance).toEqual(initialState.enhance)
  })
  it('setAfter replaces only the after image', () => {
    let s = reducer(initialState, { type: 'enhanceStart', image: img('a') })
    s = reducer(s, { type: 'setAfter', image: img('b') })
    expect(s.before?.name).toBe('a')
    expect(s.after?.name).toBe('b')
  })
  it('uploading images or clearing leaves enhance mode', () => {
    let s = reducer(initialState, { type: 'enhanceStart', image: img('a') })
    s = reducer(s, { type: 'images', images: [img('x'), img('y')] })
    expect(s.enhanceMode).toBe(false)
    s = reducer(s, { type: 'enhanceStart', image: img('a') })
    s = reducer(s, { type: 'clear' })
    expect(s.enhanceMode).toBe(false)
    expect(s.enhance).toEqual(initialState.enhance)
  })
})
