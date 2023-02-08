import createEmotionCache from './createEmotionCache.js'

describe('createEmotionCache', () => {
  it('rcreateEmotionCache', async () => {
    const emotionCache = createEmotionCache()
    expect(emotionCache.key).toBe('css')
  })
})
