import createEmotionCache from 'utils/createEmotionCache'
import { describe, expect, it } from 'vitest'

describe('createEmotionCache', () => {
  it('createEmotionCache', async () => {
    const emotionCache = createEmotionCache()
    expect(emotionCache.key).toBe('css')
  })
})
