import { describe, expect, test, vi } from 'vitest'

import { getImageLayers } from '../../../src/services/images/getImageLayers.js'

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
    ).rejects.toThrowError(/^Registry manifest body missing./)
  })
})
