import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  checkUserAuth,
  getImageManifest,
  joinDistributionPackageName,
  renameImage,
  softDeleteImage,
  splitDistributionPackageName,
} from '../../src/services/registry.js'
import { InternalError } from '../../src/utils/error.js'

const authMocks = vi.hoisted(() => ({
  default: {
    image: vi.fn(),
  },
}))
vi.mock('../../src/connectors/authorisation/index.js', () => authMocks)

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(function () {
    return {
      _id: 'test',
    }
  }),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const releaseMocks = vi.hoisted(() => ({
  findAndDeleteImageFromReleases: vi.fn(),
}))
vi.mock('../../src/services/release.js', () => releaseMocks)

const registryAuthMocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(function () {
    return 'token'
  }),
  softDeletePrefix: 'soft_deleted/',
}))
vi.mock('../../src/routes/v1/registryAuth.ts', () => registryAuthMocks)

const registryClientMocks = vi.hoisted(() => ({
  deleteManifest: vi.fn(),
  getImageTagManifest: vi.fn(),
  listImageTags: vi.fn(function () {
    return [] as string[]
  }),
  mountBlob: vi.fn(),
  putManifest: vi.fn(),
}))
vi.mock('../../src/clients/registry.ts', () => registryClientMocks)

describe('services > registry', () => {
  describe('regex', () => {
    test('splitDistributionPackageName > success', () => {
      expect(splitDistributionPackageName('name:tag')).toMatchSnapshot()
      expect(splitDistributionPackageName('registry:3.0.0')).toMatchSnapshot()
      expect(splitDistributionPackageName('alpine:latest')).toMatchSnapshot()

      expect(splitDistributionPackageName('localhost:8080/name:tag')).toMatchSnapshot()
      expect(splitDistributionPackageName('clamav/clamav:1.4.2_base')).toMatchSnapshot()
      expect(splitDistributionPackageName('bitnamilegacy/minio:2025.4.22')).toMatchSnapshot()
      expect(splitDistributionPackageName('tarampampam/webhook-tester:latest')).toMatchSnapshot()
      expect(splitDistributionPackageName('marlonb/mailcrab:v1.5.0')).toMatchSnapshot()
      expect(splitDistributionPackageName('localhost:8080/export-4lvt8w/alpine:latest')).toMatchSnapshot()
      expect(
        splitDistributionPackageName('localhost:8080/exportfrom-v4yzsn/alpine/test/foo/bar:latest'),
      ).toMatchSnapshot()
      expect(splitDistributionPackageName('nginxinc/nginx-unprivileged:1.25.4-alpine3.18')).toMatchSnapshot()

      expect(splitDistributionPackageName('name@digest:0123456789abcdef0123456789abcdef')).toMatchSnapshot()
      expect(
        splitDistributionPackageName(
          'registry@sha256:1fc7de654f2ac1247f0b67e8a459e273b0993be7d2beda1f3f56fbf1001ed3e7',
        ),
      ).toMatchSnapshot()
      expect(
        splitDistributionPackageName('alpine@sha256:a8560b36e8b8210634f77d9f7f9efd7ffa463e380b75e2e74aff4511df3ef88c'),
      ).toMatchSnapshot()

      expect(
        splitDistributionPackageName('localhost:8080/name@digest:0123456789abcdef0123456789abcdef'),
      ).toMatchSnapshot()
      expect(
        splitDistributionPackageName(
          'clamav/clamav@sha256:e7d108f30ea8f16935dbd12e4b58665f1bc148ce3dd59028cf04088330216910',
        ),
      ).toMatchSnapshot()
      expect(
        splitDistributionPackageName(
          'bitnamilegacy/minio@sha256:d7cd0e172c4cc0870f4bdc3142018e2a37be9acf04d68f386600daad427e0cab',
        ),
      ).toMatchSnapshot()
      expect(
        splitDistributionPackageName(
          'tarampampam/webhook-tester@sha256:958a70683cbfdc8b150207b3f3732d0087df1c1a260e8b2f9cf0ec77dbedead3',
        ),
      ).toMatchSnapshot()
      expect(
        splitDistributionPackageName(
          'marlonb/mailcrab@sha256:217db02005fbf51263789d63bfa63011011004685932d330ef8cefcfc054e8da',
        ),
      ).toMatchSnapshot()
      expect(
        splitDistributionPackageName(
          'localhost:8080/export-4lvt8w/alpine@sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
        ),
      ).toMatchSnapshot()
      expect(
        splitDistributionPackageName(
          'localhost:8080/exportfrom-v4yzsn/alpine/test/foo/bar@sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
        ),
      ).toMatchSnapshot()
      expect(
        splitDistributionPackageName(
          'nginxinc/nginx-unprivileged@sha256:7b4316677e4015a53d326e657915340128d9fd506f826f676d9f169c0c8557f6',
        ),
      ).toMatchSnapshot()
    })

    test('splitDistributionPackageName > error', () => {
      expect(() => splitDistributionPackageName('bad-name')).toThrowError('Could not parse Distribution Package Name.')
      expect(() => splitDistributionPackageName('foo:bar:baz')).toThrowError(
        'Could not parse Distribution Package Name.',
      )
      expect(() => splitDistributionPackageName('')).toThrowError('Could not parse Distribution Package Name.')
      expect(() => splitDistributionPackageName('bad-name@:0123456789abcdef0123456789abcdef')).toThrowError(
        'Could not parse Distribution Package Name.',
      )
      expect(() => splitDistributionPackageName('bad-name@sha256:0')).toThrowError(
        'Could not parse Distribution Package Name.',
      )
    })

    test('joinDistributionPackageName > success', () => {
      expect(joinDistributionPackageName({ path: 'name', tag: 'tag' })).toMatchSnapshot()
      expect(joinDistributionPackageName({ path: 'registry', tag: '3.0.0' })).toMatchSnapshot()
      expect(joinDistributionPackageName({ path: 'alpine', tag: 'latest' })).toMatchSnapshot()

      expect(
        joinDistributionPackageName({ path: 'name', digest: 'digest:0123456789abcdef0123456789abcdef' }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          path: 'registry',
          digest: 'sha256:1fc7de654f2ac1247f0b67e8a459e273b0993be7d2beda1f3f56fbf1001ed3e7',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          path: 'alpine',
          digest: 'sha256:a8560b36e8b8210634f77d9f7f9efd7ffa463e380b75e2e74aff4511df3ef88c',
        }),
      ).toMatchSnapshot()

      expect(joinDistributionPackageName({ domain: 'localhost:8080', path: 'name', tag: 'tag' })).toMatchSnapshot()
      expect(joinDistributionPackageName({ domain: 'clamav', path: 'clamav', tag: '1.4.2_base' })).toMatchSnapshot()
      expect(
        joinDistributionPackageName({ domain: 'bitnamilegacy', path: 'minio', tag: '2025.4.22' }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({ domain: 'tarampampam', path: 'webhook-tester', tag: 'latest' }),
      ).toMatchSnapshot()
      expect(joinDistributionPackageName({ domain: 'marlonb', path: 'mailcrab', tag: 'v1.5.0' })).toMatchSnapshot()
      expect(
        joinDistributionPackageName({ domain: 'localhost:8080', path: 'export-4lvt8w/alpine', tag: 'latest' }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          domain: 'localhost:8080',
          path: 'exportfrom-v4yzsn/alpine/test/foo/bar',
          tag: 'latest',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({ path: 'nginxinc/nginx-unprivileged', tag: '1.25.4-alpine3.18' }),
      ).toMatchSnapshot()

      expect(
        joinDistributionPackageName({
          domain: 'localhost:8080',
          path: 'name',
          digest: 'sha256:0123456789abcdef0123456789abcdef',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          domain: 'clamav',
          path: 'clamav',
          digest: 'sha256:e7d108f30ea8f16935dbd12e4b58665f1bc148ce3dd59028cf04088330216910',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          domain: 'bitnamilegacy',
          path: 'minio',
          digest: 'sha256:d7cd0e172c4cc0870f4bdc3142018e2a37be9acf04d68f386600daad427e0cab',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          domain: 'tarampampam',
          path: 'webhook-tester',
          digest: 'sha256:958a70683cbfdc8b150207b3f3732d0087df1c1a260e8b2f9cf0ec77dbedead3',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          domain: 'marlonb',
          path: 'mailcrab',
          digest: 'sha256:217db02005fbf51263789d63bfa63011011004685932d330ef8cefcfc054e8da',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          domain: 'localhost:8080',
          path: 'export-4lvt8w/alpine',
          digest: 'sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          domain: 'localhost:8080',
          path: 'exportfrom-v4yzsn/alpine/test/foo/bar',
          digest: 'sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
        }),
      ).toMatchSnapshot()
      expect(
        joinDistributionPackageName({
          path: 'nginxinc/nginx-unprivileged',
          digest: 'sha256:7b4316677e4015a53d326e657915340128d9fd506f826f676d9f169c0c8557f6',
        }),
      ).toMatchSnapshot()
    })

    test('joinDistributionPackageName > error', () => {
      expect(() => joinDistributionPackageName({ path: 'bad-name', tag: '' })).toThrowError(
        'Could not join Distribution Package Name.',
      )
      expect(() => joinDistributionPackageName({ path: '', tag: 'foo:bar:baz' })).toThrowError(
        'Could not join Distribution Package Name.',
      )
      expect(() => joinDistributionPackageName({ path: '', tag: '' })).toThrowError(
        'Could not join Distribution Package Name.',
      )
      expect(() => joinDistributionPackageName({ path: '', digest: ':0123456789abcdef0123456789abcdef' })).toThrowError(
        'Could not join Distribution Package Name.',
      )
      expect(() => joinDistributionPackageName({ domain: 'bad-name', path: '', digest: 'sha256:0' })).toThrowError(
        'Could not join Distribution Package Name.',
      )
    })

    test('joinDistributionPackageName -> splitDistributionPackageName > success', () => {
      const testObjects = [
        { path: 'name', tag: 'tag' },
        { path: 'registry', tag: '3.0.0' },
        { path: 'alpine', tag: 'latest' },
        { path: 'nginxinc/nginx-unprivileged', tag: '1.25.4-alpine3.18' },
        { path: 'name', digest: 'digest:0123456789abcdef0123456789abcdef' },
        {
          path: 'registry',
          digest: 'sha256:1fc7de654f2ac1247f0b67e8a459e273b0993be7d2beda1f3f56fbf1001ed3e7',
        },
        {
          path: 'alpine',
          digest: 'sha256:a8560b36e8b8210634f77d9f7f9efd7ffa463e380b75e2e74aff4511df3ef88c',
        },
        {
          path: 'nginxinc/nginx-unprivileged',
          digest: 'sha256:7b4316677e4015a53d326e657915340128d9fd506f826f676d9f169c0c8557f6',
        },
        {
          domain: 'localhost:8080',
          path: 'export-4lvt8w/alpine',
          digest: 'sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
        },
        {
          path: 'node',
          tag: '24.4.1-alpine',
        },
        {
          domain: 'localhost:8080',
          path: 's-3l1kaq/tensorflow/tensorflow',
          tag: 'latest-gpu-jupyter',
        },
        {
          path: 'tensorflow/tensorflow',
          tag: 'latest-gpu-jupyter',
        },
      ]

      for (const testObject of testObjects) {
        expect(splitDistributionPackageName(joinDistributionPackageName(testObject))).toStrictEqual(testObject)
      }
    })

    test('splitDistributionPackageName -> joinDistributionPackageName > success', () => {
      const testStrings = [
        'name:tag',
        'registry:3.0.0',
        'alpine:latest',
        'nginxinc/nginx-unprivileged:1.25.4-alpine3.18',
        'name@digest:0123456789abcdef0123456789abcdef',
        'registry@sha256:1fc7de654f2ac1247f0b67e8a459e273b0993be7d2beda1f3f56fbf1001ed3e7',
        'alpine@sha256:a8560b36e8b8210634f77d9f7f9efd7ffa463e380b75e2e74aff4511df3ef88c',
        'nginxinc/nginx-unprivileged@sha256:7b4316677e4015a53d326e657915340128d9fd506f826f676d9f169c0c8557f6',
        'localhost:8080/export-4lvt8w/alpine/sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
        'node:24.4.1-alpine',
        'localhost:8080/s-3l1kaq/tensorflow/tensorflow:latest-gpu-jupyter',
        'tensorflow/tensorflow:latest-gpu-jupyter',
      ]

      for (const testString of testStrings) {
        expect(joinDistributionPackageName(splitDistributionPackageName(testString))).toStrictEqual(testString)
      }
    })
  })

  describe('core functionality', () => {
    beforeEach(() => {
      authMocks.default.image.mockReturnValue({
        success: true,
        id: '',
      })
    })

    test('checkUserAuth > success', async () => {
      await checkUserAuth({ dn: 'user' }, 'modelId', ['list'])

      expect(modelMocks.getModelById).toBeCalledWith({ dn: 'user' }, 'modelId')
      expect(authMocks.default.image).toBeCalledWith(
        { dn: 'user' },
        { _id: 'test' },
        { type: 'repository', name: 'modelId', actions: ['list'] },
      )
    })

    test('checkUserAuth > forbidden', async () => {
      authMocks.default.image.mockReturnValueOnce({ success: false, info: 'Error' })

      const promise = checkUserAuth({ dn: 'user' }, 'modelId', ['list'])

      await expect(promise).rejects.toThrowError('Error')
      expect(modelMocks.getModelById).toBeCalledWith({ dn: 'user' }, 'modelId')
      expect(authMocks.default.image).toBeCalledWith(
        { dn: 'user' },
        { _id: 'test' },
        { type: 'repository', name: 'modelId', actions: ['list'] },
      )
    })

    test('getImageManifest > success', async () => {
      await getImageManifest({} as any, {} as any)

      expect(registryAuthMocks.getAccessToken).toHaveBeenCalled()
      expect(registryClientMocks.getImageTagManifest).toHaveBeenCalled()
    })

    test('getImageManifest > bad response', async () => {
      registryClientMocks.getImageTagManifest.mockRejectedValue('Error')

      await expect(getImageManifest({} as any, {} as any)).rejects.toThrowError('Error')

      expect(registryAuthMocks.getAccessToken).toHaveBeenCalled()
    })

    test('renameImage > source manifest not found', async () => {
      registryClientMocks.getImageTagManifest.mockRejectedValueOnce(InternalError('Error', { status: 404 }))

      await expect(renameImage({} as any, {} as any, {} as any)).rejects.toThrowError(
        'The requested image was not found.',
      )
    })

    test('renameImage > source manifest other error', async () => {
      registryClientMocks.getImageTagManifest.mockRejectedValueOnce(InternalError('Error'))

      await expect(renameImage({} as any, {} as any, {} as any)).rejects.toThrowError('Error')
    })

    test('renameImage > config missing digest', async () => {
      registryClientMocks.getImageTagManifest.mockResolvedValueOnce({
        body: { config: {}, layers: [] },
      })

      await expect(renameImage({} as any, {} as any, {} as any)).rejects.toThrowError('Could not extract layer digest.')
    })

    test('renameImage > success and delete orphan', async () => {
      const mockBody = { config: { digest: 'digest' }, layers: [{ digest: 'digest' }], mediaType: 'mediaType' }
      registryClientMocks.getImageTagManifest
        .mockResolvedValueOnce({
          body: mockBody,
          headers: { 'docker-content-digest': 'digest' },
        })
        .mockResolvedValueOnce({
          body: mockBody,
          headers: { 'docker-content-digest': 'otherDigest' },
        })
      registryClientMocks.listImageTags.mockResolvedValueOnce(['newTag'])
      const source = { name: 'sourceName', repository: 'sourceRepository', tag: 'sourceTag' }
      const destination = { name: 'destinationName', repository: 'destinationRepository', tag: 'destinationTag' }

      await renameImage({} as any, source, destination)

      expect(registryClientMocks.mountBlob).toBeCalledTimes(2)
      expect(registryClientMocks.putManifest).toBeCalledWith(
        'token',
        destination,
        JSON.stringify(mockBody),
        'mediaType',
      )
      expect(registryClientMocks.deleteManifest).toBeCalledWith('token', source)
      expect(registryClientMocks.deleteManifest).toBeCalledWith('token', { ...source, tag: 'digest' })
    })

    test('renameImage > success no orphan found', async () => {
      const mockBody = { config: { digest: 'digest' }, layers: [{ digest: 'digest' }], mediaType: 'mediaType' }
      registryClientMocks.getImageTagManifest.mockResolvedValue({
        body: mockBody,
        headers: { 'docker-content-digest': 'digest' },
      })
      registryClientMocks.listImageTags.mockResolvedValueOnce(['newTag'])
      const source = { name: 'sourceName', repository: 'sourceRepository', tag: 'sourceTag' }
      const destination = { name: 'destinationName', repository: 'destinationRepository', tag: 'destinationTag' }

      await renameImage({} as any, source, destination)

      expect(registryClientMocks.mountBlob).toBeCalledTimes(2)
      expect(registryClientMocks.putManifest).toBeCalledWith(
        'token',
        destination,
        JSON.stringify(mockBody),
        'mediaType',
      )
      expect(registryClientMocks.deleteManifest).toBeCalledWith('token', source)
      expect(registryClientMocks.deleteManifest).toHaveBeenCalledOnce()
    })

    test('renameImage > success handle 404', async () => {
      const mockBody = { config: { digest: 'digest' }, layers: [{ digest: 'digest' }], mediaType: 'mediaType' }
      registryClientMocks.getImageTagManifest.mockResolvedValueOnce({
        body: mockBody,
        headers: { 'docker-content-digest': 'digest' },
      })
      registryClientMocks.listImageTags.mockRejectedValueOnce(InternalError('Error', { status: 404 }))
      const source = { name: 'sourceName', repository: 'sourceRepository', tag: 'sourceTag' }
      const destination = { name: 'destinationName', repository: 'destinationRepository', tag: 'destinationTag' }

      await renameImage({} as any, source, destination)

      expect(registryClientMocks.mountBlob).toBeCalledTimes(2)
      expect(registryClientMocks.putManifest).toBeCalledWith(
        'token',
        destination,
        JSON.stringify(mockBody),
        'mediaType',
      )
      expect(registryClientMocks.deleteManifest).toBeCalledWith('token', source)
      expect(registryClientMocks.deleteManifest).toBeCalledWith('token', { ...source, tag: 'digest' })
    })

    test('renameImage > rethrow error', async () => {
      const mockBody = { config: { digest: 'digest' }, layers: [{ digest: 'digest' }], mediaType: 'mediaType' }
      registryClientMocks.getImageTagManifest.mockResolvedValueOnce({
        body: mockBody,
        headers: { 'docker-content-digest': 'digest' },
      })
      registryClientMocks.listImageTags.mockRejectedValueOnce(InternalError('Error'))
      const source = { name: 'sourceName', repository: 'sourceRepository', tag: 'sourceTag' }
      const destination = { name: 'destinationName', repository: 'destinationRepository', tag: 'destinationTag' }

      const promise = renameImage({} as any, source, destination)

      await expect(promise).rejects.toThrowError('Error')
      expect(registryClientMocks.mountBlob).toBeCalledTimes(2)
      expect(registryClientMocks.putManifest).toBeCalledWith(
        'token',
        destination,
        JSON.stringify(mockBody),
        'mediaType',
      )
      expect(registryClientMocks.deleteManifest).toBeCalledWith('token', source)
      expect(registryClientMocks.deleteManifest).toHaveBeenCalledTimes(1)
    })

    test('softDeleteImage > success', async () => {
      const mockBody = { config: { digest: 'digest' }, layers: [{ digest: 'digest' }], mediaType: 'mediaType' }
      registryClientMocks.getImageTagManifest.mockResolvedValue({
        body: mockBody,
        headers: { 'docker-content-digest': 'digest' },
      })
      registryClientMocks.listImageTags.mockResolvedValueOnce(['newTag'])
      const source = { name: 'sourceName', repository: 'sourceRepository', tag: 'sourceTag' }

      await softDeleteImage({} as any, source)

      expect(registryClientMocks.deleteManifest).toHaveBeenCalled()
      expect(releaseMocks.findAndDeleteImageFromReleases).toHaveBeenCalledWith(
        {},
        'sourceRepository',
        source,
        undefined,
      )
    })

    test('softDeleteImage > success bypass mirrored model check', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        settings: { mirror: { sourceModelId: 'sourceModelId' } },
      } as any)
      const mockBody = { config: { digest: 'digest' }, layers: [{ digest: 'digest' }], mediaType: 'mediaType' }
      registryClientMocks.getImageTagManifest.mockResolvedValue({
        body: mockBody,
        headers: { 'docker-content-digest': 'digest' },
      })
      registryClientMocks.listImageTags.mockResolvedValueOnce(['newTag'])
      const source = { name: 'sourceName', repository: 'sourceRepository', tag: 'sourceTag' }

      await softDeleteImage({} as any, source, true)

      expect(registryClientMocks.deleteManifest).toHaveBeenCalled()
      expect(releaseMocks.findAndDeleteImageFromReleases).toHaveBeenCalledWith(
        {},
        'sourceRepository',
        source,
        undefined,
      )
    })

    test('softDeleteImage > fail on mirrored model', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        settings: { mirror: { sourceModelId: 'sourceModelId' } },
      } as any)

      const promise = softDeleteImage({} as any, {} as any)

      await expect(promise).rejects.toThrowError(/^Cannot remove image from a mirrored model./)
      expect(registryClientMocks.deleteManifest).not.toHaveBeenCalled()
      expect(releaseMocks.findAndDeleteImageFromReleases).not.toHaveBeenCalled()
    })
  })
})
