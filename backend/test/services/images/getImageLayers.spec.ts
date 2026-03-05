import { describe, expect, test, vi } from 'vitest'

import { getImageLayers } from '../../../src/services/images/getImageLayers.js'

vi.mock('../../../src/services/registry.js')

const registryMocks = vi.hoisted(() => ({
  getImageManifest: vi.fn(),
}))
vi.mock('../../../src/services/registry.js', () => registryMocks)

describe('services > images > getImageLayers', () => {
  test('return config and layers from image manifest', async () => {
    registryMocks.getImageManifest.mockResolvedValueOnce({
      body: {
        config: { digest: 'sha256:config' },
        layers: [{ digest: 'sha256:layer1' }, { digest: 'sha256:layer2' }],
      },
    })

    const result = await getImageLayers(
      { id: 'user1' } as any,
      {
        repository: 'repo',
        name: 'image',
        tag: 'latest',
      } as any,
    )

    expect(result).toEqual([{ digest: 'sha256:config' }, { digest: 'sha256:layer1' }, { digest: 'sha256:layer2' }])
  })

  test('throw InternalError when manifest body is missing', async () => {
    registryMocks.getImageManifest.mockResolvedValueOnce({})

    await expect(
      getImageLayers(
        { id: 'user1' } as any,
        {
          repository: 'repo',
          name: 'image',
          tag: 'latest',
        } as any,
      ),
    ).rejects.toThrowError(/^Registry manifest body missing./)
  })
})
