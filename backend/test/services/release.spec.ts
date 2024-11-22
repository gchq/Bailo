import { describe, expect, test, vi } from 'vitest'

import { ReleaseAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import {
  createRelease,
  deleteRelease,
  getAllFileIds,
  getFileByReleaseFileName,
  getModelReleases,
  getReleaseBySemver,
  getReleasesForExport,
  newReleaseComment,
  removeFileFromReleases,
  updateRelease,
} from '../../src/services/release.js'

vi.mock('../../src/connectors/authorisation/index.js')

const responseModelMock = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.limit = vi.fn(() => obj)
  obj.unwind = vi.fn(() => obj)
  obj.at = vi.fn(() => obj)
  obj.map = vi.fn(() => [])
  obj.filter = vi.fn(() => [])

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})

vi.mock('../../src/models/Response.js', async () => ({
  ...((await vi.importActual('../../src/models/Response.js')) as object),
  default: responseModelMock,
}))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({
    id: 'test_model_id',
    card: { version: 1 },
    settings: { mirror: { sourceModelId: '' } },
  })),
  getModelCardRevision: vi.fn(),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const registryMocks = vi.hoisted(() => ({
  listModelImages: vi.fn(),
}))
vi.mock('../../src/services/registry.js', () => registryMocks)

const fileMocks = vi.hoisted(() => ({
  getFileById: vi.fn(),
  getFilesByIds: vi.fn(),
}))
vi.mock('../../src/services/file.js', () => fileMocks)

const releaseModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.unwind = vi.fn(() => obj)
  obj.group = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.updateMany = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.findOneWithDeleted = vi.fn(() => obj)
  obj.filter = vi.fn(() => obj)

  const model: any = vi.fn((params) => ({ ...obj, ...params }))
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/Release.js', () => ({ default: releaseModelMocks }))

const mockReviewService = vi.hoisted(() => {
  return {
    createReleaseReviews: vi.fn(),
  }
})
vi.mock('../../src/services/review.js', () => mockReviewService)

const mockWebhookService = vi.hoisted(() => {
  return {
    sendWebhooks: vi.fn(),
  }
})
vi.mock('../../src/services/webhook.js', () => mockWebhookService)

describe('services > release', () => {
  test('createRelease > simple', async () => {
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0', minor: false } as any)

    expect(releaseModelMocks.save).toBeCalled()
    expect(releaseModelMocks).toBeCalled()
    expect(mockReviewService.createReleaseReviews).toBeCalled()
    expect(mockWebhookService.sendWebhooks).toBeCalled()
  })

  test('createRelease > minor release', async () => {
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0', minor: true } as any)

    expect(releaseModelMocks.save).toBeCalled()
    expect(releaseModelMocks).toBeCalled()
    expect(mockReviewService.createReleaseReviews).not.toBeCalled()
  })

  test('createRelease > release with image', async () => {
    const existingImages = [{ repository: 'mockRep', name: 'image', tags: ['latest'] }]
    registryMocks.listModelImages.mockResolvedValueOnce(existingImages)

    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    await createRelease(
      {} as any,
      {
        semver: 'v1.0.0',
        images: existingImages.flatMap(({ tags, ...rest }) => tags.map((tag) => ({ tag, ...rest }))),
      } as any,
    )

    expect(releaseModelMocks.save).toBeCalled()
    expect(releaseModelMocks).toBeCalled()
    expect(mockReviewService.createReleaseReviews).toBeCalled()
  })

  test('createRelease > missing images in the registry', async () => {
    const existingImages = [{ repository: 'mockRep', name: 'image', tags: ['latest'] }]
    registryMocks.listModelImages.mockResolvedValueOnce(existingImages)
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    expect(() =>
      createRelease(
        {} as any,
        {
          semver: 'v1.0.0',
          modelCardVersion: 999,
          images: [
            { repository: 'fake', name: 'fake', tag: 'fake1' },
            { repository: 'fake', name: 'fake', tag: 'fake2' },
          ].concat(existingImages.flatMap(({ tags, ...rest }) => tags.map((tag) => ({ tag, ...rest })))),
        } as any,
      ),
    ).rejects.toThrowError(/^The following images do not exist in the registry/)
    expect(releaseModelMocks.save).not.toBeCalled()
    expect(releaseModelMocks).not.toBeCalled()
    expect(mockReviewService.createReleaseReviews).not.toBeCalled()
  })

  test('createRelease > release with bad files', async () => {
    fileMocks.getFileById.mockResolvedValueOnce({ modelId: 'random_model' })
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    expect(() =>
      createRelease(
        {} as any,
        {
          semver: 'v1.0.0',
          modelCardVersion: 999,
          fileIds: ['test'],
        } as any,
      ),
    ).rejects.toThrowError(/^The file 'test' comes from the model/)

    expect(releaseModelMocks.save).not.toBeCalled()
  })

  test('createRelease > release with duplicate file names', async () => {
    fileMocks.getFileById.mockResolvedValue({ modelId: 'test_model_id', name: 'test_file.png' })
    modelMocks.getModelById.mockResolvedValue({
      id: 'test_model_id',
      card: { version: 1 },
      settings: { mirror: { sourceModelId: '' } },
    })
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    expect(
      async () =>
        await createRelease(
          {} as any,
          {
            semver: 'v1.0.0',
            modelCardVersion: 999,
            fileIds: ['test', 'test2'],
          } as any,
        ),
    ).rejects.toThrowError(/^Releases cannot have multiple files with the same name/)

    expect(releaseModelMocks.save).not.toBeCalled()
  })

  test('createRelease > release with bad semver', async () => {
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)
    const result = createRelease(
      {} as any,
      {
        semver: 'bad semver',
        modelCardVersion: 999,
      } as any,
    )
    expect(result).rejects.toThrowError(/is not a valid semver value./)

    expect(releaseModelMocks.save).not.toBeCalled()
  })

  test('createRelease > bad authorisation', async () => {
    vi.mocked(authorisation.release).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)
    expect(() => createRelease({} as any, { semver: 'v1.0.0' } as any)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('createRelease > automatic model card version', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({
      id: 'test_model_id',
      card: { version: 999 },
      settings: { mirror: { sourceModelId: '' } },
    })
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0' } as any)

    expect(releaseModelMocks.save).toBeCalled()
    expect(releaseModelMocks.mock.calls.at(0)[0].modelCardVersion).toBe(999)
  })

  test('createRelease > no model card', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({
      id: 'test_model_id',
      card: undefined as any,
      settings: { mirror: { sourceModelId: '' } },
    })

    expect(() => createRelease({} as any, { semver: 'v1.0.0' } as any)).rejects.toThrowError(
      /^This model does not have a model card associated with it/,
    )

    expect(releaseModelMocks.save).not.toBeCalled()
  })

  test('createRelease > should throw Bad Req if the user tries to alter a mirrored model card', async () => {
    vi.mocked(authorisation.release).mockResolvedValueOnce({
      info: 'Cannot create a release from a mirrored model',
      success: false,
      id: '',
    })
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)
    expect(() => createRelease({} as any, { semver: 'v1.0.0' } as any)).rejects.toThrowError(
      /^Cannot create a release from a mirrored model/,
    )
  })

  test('updateRelease > bad authorisation', async () => {
    vi.mocked(authorisation.release).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })
    expect(() => updateRelease({} as any, 'model-id', 'v1.0.0', {} as any)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('updateRelease > release with bad files', async () => {
    fileMocks.getFileById.mockResolvedValueOnce({ modelId: 'random_model' })

    expect(() =>
      updateRelease({} as any, 'model-id', 'v1.0.0', {
        semver: 'v1.0.0',
        fileIds: ['test'],
      } as any),
    ).rejects.toThrowError(/^The file 'test' comes from the model/)
  })

  test('updateRelease > success', async () => {
    releaseModelMocks.findOne.mockResolvedValue({ semver: 'v1.0.0' })

    await updateRelease({} as any, 'model-id', 'v1.0.0', { notes: 'New notes' } as any)

    expect(releaseModelMocks.findOneAndUpdate).toBeCalled()
  })

  test('updateRelease > should throw Bad Req when attempting to update a release on a mirrored model ', async () => {
    vi.mocked(authorisation.release).mockResolvedValue({
      info: 'Cannot update a release on a mirrored model.',
      success: false,
      id: '',
    })
    expect(() => updateRelease({} as any, 'model-id', 'v1.0.0', {} as any)).rejects.toThrowError(
      /^Cannot update a release on a mirrored model./,
    )
  })

  test('newReleaseComment > success', async () => {
    releaseModelMocks.findOneAndUpdate.mockResolvedValue({})

    await newReleaseComment({} as any, 'model', '1.0.0', 'This is a new comment')

    expect(responseModelMock.save).toBeCalled()
  })

  test('newReleaseComment > should throw bad request when attempting to create a release comment on a mirrored model', async () => {
    vi.mocked(authorisation.release).mockResolvedValue({
      info: 'Cannot create a new comment on a mirrored model.',
      success: false,
      id: '',
    })
    modelMocks.getModelById.mockResolvedValueOnce({
      id: 'test_model_id',
      card: { version: 1 },
      settings: { mirror: { sourceModelId: '123' } },
    })
    expect(() => newReleaseComment({} as any, 'model', '1.0.0', 'This is a new comment')).rejects.toThrowError(
      /^Cannot create a new comment on a mirrored model./,
    )
    expect(releaseModelMocks.findOneAndUpdate).not.toBeCalled()
  })

  test('getModelReleases > good', async () => {
    await getModelReleases({} as any, 'modelId')

    vi.mocked(releaseModelMocks.lookup).mockImplementation(() => ({
      ...releaseModelMocks.lookup,
    }))

    expect(releaseModelMocks.match.mock.calls.at(0)).toMatchSnapshot()
    expect(releaseModelMocks.sort.mock.calls.at(0)).toMatchSnapshot()
    expect(releaseModelMocks.lookup.mock.calls.at(0)).toMatchSnapshot()
    expect(releaseModelMocks.append.mock.calls.at(0)).toMatchSnapshot()
  })

  test('getReleaseBySemver > good', async () => {
    const mockRelease = { _id: 'release' }

    releaseModelMocks.findOne.mockResolvedValue(mockRelease)

    expect(await getReleaseBySemver({} as any, 'test', 'test')).toBe(mockRelease)
  })

  test('getReleaseBySemver > no release', async () => {
    releaseModelMocks.findOne.mockResolvedValue(undefined)

    expect(() => getReleaseBySemver({} as any, 'test', 'test')).rejects.toThrowError(
      /^The requested release was not found./,
    )
  })

  test('getReleaseBySemver > no permission', async () => {
    const mockRelease = { _id: 'release' }

    releaseModelMocks.findOne.mockResolvedValue(mockRelease)
    vi.mocked(authorisation.release).mockResolvedValue({
      info: 'You do not have permission to view this release.',
      success: false,
      id: '',
    })

    expect(() => getReleaseBySemver({} as any, 'test', 'test')).rejects.toThrowError(
      /^You do not have permission to view this release./,
    )
  })

  test('deleteRelease > success', async () => {
    expect(await deleteRelease({} as any, 'test', 'test')).toStrictEqual({ modelId: 'test', semver: 'test' })
  })

  test('deleteRelease > no permission', async () => {
    const mockRelease = { _id: 'release' }

    releaseModelMocks.findOne.mockResolvedValue(mockRelease)

    vi.mocked(authorisation.release).mockImplementation(async (_user, _model, action, _release) => {
      if (action === ReleaseAction.View) return { success: true, id: '' }
      if (action === ReleaseAction.Delete)
        return { success: false, info: 'You do not have permission to delete this release.', id: '' }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    expect(() => deleteRelease({} as any, 'test', 'test')).rejects.toThrowError(
      /^You do not have permission to delete this release./,
    )
    expect(releaseModelMocks.save).not.toBeCalled()
  })

  test('deleteRelease > should throw a bad req when attempting to delete a release from a mirrored model', async () => {
    const mockRelease = { _id: 'release' }

    releaseModelMocks.findOne.mockResolvedValue(mockRelease)

    vi.mocked(authorisation.release).mockImplementation(async (_user, _model, action, _release) => {
      if (action === ReleaseAction.View) return { success: true, id: '' }
      if (action === ReleaseAction.Delete)
        return { success: false, info: 'Cannot delete a file from a mirrored model.', id: '' }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    expect(() => deleteRelease({} as any, 'test', 'test')).rejects.toThrowError(
      /^Cannot delete a file from a mirrored model./,
    )
    expect(releaseModelMocks.save).not.toBeCalled()
  })

  test('removeFileFromReleases > no permission', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModel: any = { id: 'test', settings: { mirror: { sourceModelId: '' } } }
    const mockRelease = { _id: 'release' }

    vi.mocked(authorisation.releases).mockResolvedValue([
      {
        success: false,
        info: 'You do not have permission to update these releases.',
        id: '',
      },
    ])

    releaseModelMocks.find.mockResolvedValueOnce([mockRelease, mockRelease])

    const result = removeFileFromReleases(mockUser, mockModel, '')

    expect(result).rejects.toThrowError(/^You do not have permission to update these releases./)
    expect(releaseModelMocks.updateMany).not.toBeCalled()
  })

  test('removeFileFromReleases > success', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModel: any = { id: 'test', settings: { mirror: { sourceModelId: '' } } }
    const mockRelease = { _id: 'release' }
    const resultObject = { modifiedCount: 2, matchedCount: 2 }

    releaseModelMocks.find.mockResolvedValueOnce([mockRelease, mockRelease])
    releaseModelMocks.updateMany.mockResolvedValueOnce(resultObject)

    const result = await removeFileFromReleases(mockUser, mockModel, '')

    expect(result).toEqual(resultObject)
  })

  test('removeFileFromReleases > should throw a bad req when attempting to remove a file from a mirrored model', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModel: any = { id: 'test', settings: { mirror: { sourceModelId: '123' } } }
    const mockRelease = { _id: 'release' }

    vi.mocked(authorisation.releases).mockResolvedValue([
      {
        success: false,
        info: 'Cannot remove a file from a mirrored model.',
        id: '',
      },
    ])

    releaseModelMocks.find.mockResolvedValueOnce([mockRelease, mockRelease])

    expect(() => removeFileFromReleases(mockUser, mockModel, '123')).rejects.toThrowError(
      /^Cannot remove a file from a mirrored model./,
    )
    expect(releaseModelMocks.delete).not.toBeCalled()
  })

  test('getFileByReleaseFileName > success', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const semver = '1.0.0'
    const fileName = 'test.png'

    fileMocks.getFilesByIds.mockResolvedValueOnce([{ name: 'test.png' }])

    const file = await getFileByReleaseFileName(mockUser, modelId, semver, fileName)

    expect(file.name).toBe('test.png')
  })

  test('getFileByReleaseFileName > file not found', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const semver = '1.0.0'
    const fileName = 'test.png'

    fileMocks.getFilesByIds.mockResolvedValueOnce([{ name: 'not_test.png' }])

    const result = getFileByReleaseFileName(mockUser, modelId, semver, fileName)
    expect(result).rejects.toThrowError(/^The requested file name was not found on the release./)
  })

  test('getReleasesForExport > release not found', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const semvers = ['1.0.0']
    releaseModelMocks.find.mockResolvedValueOnce([])

    const result = getReleasesForExport(mockUser, modelId, semvers)

    expect(result).rejects.toThrowError(/^The following releases were not found./)
  })

  test('getReleasesForExport > release not found', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const semvers = ['1.0.0']
    releaseModelMocks.find.mockResolvedValueOnce([{ semver: '1.0.0' }])
    vi.mocked(authorisation.releases).mockResolvedValue([
      { info: 'You do not have permission', success: false, id: '' },
    ])

    const result = getReleasesForExport(mockUser, modelId, semvers)

    expect(result).rejects.toThrowError(/^You do not have the necessary permissions to export these releases./)
  })

  test('getReleasesForExport > return releases', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const semvers = ['1.0.0']
    const releases = [{ semver: '1.0.0' }]
    releaseModelMocks.find.mockResolvedValueOnce(releases)

    const result = await getReleasesForExport(mockUser, modelId, semvers)

    expect(result).toBe(releases)
  })

  test('getTotalFileSize > returns fileIds', async () => {
    releaseModelMocks.group.mockResolvedValueOnce([{ fileIds: [42] }])
    const size = await getAllFileIds('example', ['1', '2', '3'])

    expect(size).toStrictEqual([42])
  })

  test('getTotalFileSize > returns empty list if no file Ids', async () => {
    releaseModelMocks.group.mockResolvedValueOnce([])
    const size = await getAllFileIds('example', ['1', '2', '3'])

    expect(size).toStrictEqual([])
  })
})
