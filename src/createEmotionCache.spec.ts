import createEmotionCache from './createEmotionCache'

describe('createEmotionCache', () => {
  it('rcreateEmotionCache', async () => {
    const emotionCache = createEmotionCache()
    expect(emotionCache.key).toBe('css')
  })
})
