import { describe, expect, test, vi } from 'vitest'

import { getImageLayers, getLayersForImage } from '../../../src/services/images/getImageLayers.js'

const registryMocks = vi.hoisted(() => ({
  getImageTagManifest: vi.fn(),
  getImageTagManifests: vi.fn(),
  isImageTagManifestList: vi.fn(() => false),
}))
vi.mock('../../../src/clients/registry.js', () => registryMocks)

describe('services > images > getImageLayers', () => {
  test('return config and layers from image manifest', async () => {
    registryMocks.getImageTagManifests.mockResolvedValueOnce({
      body: {
        config: { digest: 'sha256:config' },
        layers: [{ digest: 'sha256:layer1' }, { digest: 'sha256:layer2' }],
      },
    })

    const result = await getImageLayers('token', {
      repository: 'repo',
      name: 'image',
      tag: 'latest',
    } as any)

    expect(result).toEqual([{ digest: 'sha256:config' }, { digest: 'sha256:layer1' }, { digest: 'sha256:layer2' }])
  })

  test('throw InternalError when manifest body is missing', async () => {
    registryMocks.getImageTagManifests.mockResolvedValueOnce({})

    await expect(
      getImageLayers('token', {
        repository: 'repo',
        name: 'image',
        tag: 'latest',
      } as any),
    ).rejects.toThrow(/^Registry manifest body missing./)
  })

  test('getLayersForImage > without manifestParam fetches manifest and returns config and layers', async () => {
    registryMocks.getImageTagManifests.mockResolvedValueOnce({
      body: {
        config: { digest: 'sha256:config' },
        layers: [{ digest: 'sha256:layer1' }],
      },
    })

    const result = await getLayersForImage('token', { repository: 'repo', name: 'image', tag: 'latest' } as any)

    expect(registryMocks.getImageTagManifests).toHaveBeenCalledOnce()
    expect(result).toEqual([{ digest: 'sha256:config' }, { digest: 'sha256:layer1' }])
  })

  test('getLayersForImage > with manifestParam skips registry call and returns config and layers', async () => {
    const manifest = {
      config: { digest: 'sha256:config' },
      layers: [{ digest: 'sha256:layer1' }, { digest: 'sha256:layer2' }],
    }

    const result = await getLayersForImage(
      'token',
      { repository: 'repo', name: 'image', tag: 'latest' } as any,
      manifest as any,
    )

    expect(registryMocks.getImageTagManifests).not.toHaveBeenCalled()
    expect(result).toEqual([{ digest: 'sha256:config' }, { digest: 'sha256:layer1' }, { digest: 'sha256:layer2' }])
  })

  test('getLayersForImage > throws InternalError when manifest body is missing', async () => {
    registryMocks.getImageTagManifests.mockResolvedValueOnce({ body: undefined })

    await expect(
      getLayersForImage('token', { repository: 'repo', name: 'image', tag: 'latest' } as any),
    ).rejects.toThrow(/^The registry returned a response but the body was missing./)
  })
})
