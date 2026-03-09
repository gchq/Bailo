import { describe, expect, test, vi } from 'vitest'

import { getImageLayers } from '../../../src/services/images/getImageLayers.js'

const registryMocks = vi.hoisted(() => ({
  getImageTagManifest: vi.fn(),
  isImageTagManifestList: vi.fn(() => false),
}))
vi.mock('../../../src/clients/registry.js', () => registryMocks)

describe('services > images > getImageLayers', () => {
  test('return config and layers from image manifest', async () => {
    registryMocks.getImageTagManifest.mockResolvedValueOnce({
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
  test('throw InternalError with a manifest list', async () => {
    registryMocks.isImageTagManifestList.mockResolvedValueOnce(true)

    await expect(
      getImageLayers('token', {
        repository: 'repo',
        name: 'image',
        tag: 'latest',
      } as any),
    ).rejects.toThrowError(/^Bailo backend does not currently support manifest lists./)
  })

  test('throw InternalError when manifest body is missing', async () => {
    registryMocks.getImageTagManifest.mockResolvedValueOnce({})

    await expect(
      getImageLayers('token', {
        repository: 'repo',
        name: 'image',
        tag: 'latest',
      } as any),
    ).rejects.toThrowError(/^Registry manifest body missing./)
  })
})
