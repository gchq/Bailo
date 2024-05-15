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
  updateReleaseComment,
} from '../../src/services/release.js'
import { testReleaseReviewWithResponses } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
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
    modelMocks.getModelById.mockResolvedValue({ card: { version: 1 } })
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0', minor: false } as any)

    expect(releaseModelMocks.save).toBeCalled()
    expect(releaseModelMocks).toBeCalled()
    expect(mockReviewService.createReleaseReviews).toBeCalled()
    expect(mockWebhookService.sendWebhooks).toBeCalled()
  })

  test('createRelease > minor release', async () => {
    modelMocks.getModelById.mockResolvedValue({ card: { version: 1 } })
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0', minor: true } as any)

    expect(releaseModelMocks.save).toBeCalled()
    expect(releaseModelMocks).toBeCalled()
    expect(mockReviewService.createReleaseReviews).not.toBeCalled()
  })

  test('createRelease > release with image', async () => {
    const existingImages = [{ repository: 'mockRep', name: 'image', tags: ['latest'] }]
    registryMocks.listModelImages.mockResolvedValueOnce(existingImages)
    modelMocks.getModelById.mockResolvedValue({ card: { version: 1 } })
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
    modelMocks.getModelById.mockResolvedValue(undefined)
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
    modelMocks.getModelById.mockResolvedValue({ id: 'test_model_id' })
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
    modelMocks.getModelById.mockResolvedValue({ id: 'test_model_id' })
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
    modelMocks.getModelById.mockResolvedValueOnce({ card: { version: 1 } })
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)
    expect(() => createRelease({} as any, { semver: 'v1.0.0' } as any)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('createRelease > automatic model card version', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({ card: { version: 999 } })
    releaseModelMocks.findOneWithDeleted.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0' } as any)

    expect(releaseModelMocks.save).toBeCalled()
    expect(releaseModelMocks.mock.calls.at(0)[0].modelCardVersion).toBe(999)
  })

  test('createRelease > no model card', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({ card: undefined })

    expect(() => createRelease({} as any, { semver: 'v1.0.0' } as any)).rejects.toThrowError(
      /^This model does not have a model card associated with it/,
    )

    expect(releaseModelMocks.save).not.toBeCalled()
  })

  test('updateRelease > bad authorisation', async () => {
    vi.mocked(authorisation.release).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })
    expect(() => updateRelease({} as any, 'model-id', 'v1.0.0', {} as any)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('updateRelease > release with bad files', async () => {
    fileMocks.getFileById.mockResolvedValueOnce({ modelId: 'random_model' })
    modelMocks.getModelById.mockResolvedValue({ id: 'test_model_id' })

    expect(() =>
      updateRelease({} as any, 'model-id', 'v1.0.0', {
        semver: 'v1.0.0',
        fileIds: ['test'],
      } as any),
    ).rejects.toThrowError(/^The file 'test' comes from the model/)
  })

  test('updateRelease > success', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOne.mockResolvedValue({ semver: 'v1.0.0' })

    await updateRelease({} as any, 'model-id', 'v1.0.0', { notes: 'New notes' } as any)

    expect(releaseModelMocks.findOneAndUpdate).toBeCalled()
  })

  test('newReleaseComment > success', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOneAndUpdate.mockResolvedValue({})

    await newReleaseComment({} as any, 'model', '1.0.0', 'This is a new comment')

    expect(releaseModelMocks.findOneAndUpdate).toBeCalled()
  })

  test('updateReleaseComment > success', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOneAndUpdate.mockResolvedValue(testReleaseReviewWithResponses)

    await updateReleaseComment({} as any, 'model', '1.0.0', 'commentid', 'This is an updated comment')

    expect(releaseModelMocks.findOneAndUpdate).toBeCalled()
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

    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOne.mockResolvedValue(mockRelease)

    expect(await getReleaseBySemver({} as any, 'test', 'test')).toBe(mockRelease)
  })

  test('getReleaseBySemver > no release', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOne.mockResolvedValue(undefined)

    expect(() => getReleaseBySemver({} as any, 'test', 'test')).rejects.toThrowError(
      /^The requested release was not found./,
    )
  })

  test('getReleaseBySemver > no permission', async () => {
    const mockRelease = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
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
    modelMocks.getModelById.mockResolvedValue(undefined)

    expect(await deleteRelease({} as any, 'test', 'test')).toStrictEqual({ modelId: 'test', semver: 'test' })
  })

  test('deleteRelease > no permission', async () => {
    const mockRelease = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOne.mockResolvedValue(mockRelease)

    vi.mocked(authorisation.release).mockImplementation(async (_user, _model, _release, action) => {
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

  test('removeFileFromReleases > no permission', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModel: any = { id: 'test' }
    const mockRelease = { _id: 'release' }

    vi.mocked(authorisation.releases).mockResolvedValue([
      {
        success: false,
        info: 'You do not have permission to update these releases.',
        id: '',
      },
    ])

    releaseModelMocks.find.mockResolvedValueOnce([mockRelease, mockRelease])

    const result = removeFileFromReleases(mockUser, mockModel, '123')

    expect(result).rejects.toThrowError(/^You do not have permission to update these releases./)
    expect(releaseModelMocks.updateMany).not.toBeCalled()
  })

  test('removeFileFromReleases > success', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModel: any = { id: 'test' }
    const mockRelease = { _id: 'release' }
    const resultObject = { modifiedCount: 2, matchedCount: 2 }

    releaseModelMocks.find.mockResolvedValueOnce([mockRelease, mockRelease])
    releaseModelMocks.updateMany.mockResolvedValueOnce(resultObject)

    const result = await removeFileFromReleases(mockUser, mockModel, '123')

    expect(result).toEqual(resultObject)
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
    expect(result).rejects.toThrowError(/^The requested filename was not found on the release./)
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
