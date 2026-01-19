import { describe, expect, test, vi } from 'vitest'

import { ReleaseAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { SemverObject } from '../../src/models/Release.js'
import { UserInterface } from '../../src/models/User.js'
import { listModelImages } from '../../src/services/registry.js'
import {
  createRelease,
  deleteRelease,
  deleteReleases,
  findAndDeleteImageFromReleases,
  getAllFileIds,
  getFileByReleaseFileName,
  getModelReleases,
  getReleaseBySemver,
  getReleasesForExport,
  isReleaseDoc,
  newReleaseComment,
  removeFileFromReleases,
  semverObjectToString,
  updateRelease,
  validateRelease,
} from '../../src/services/release.js'
import { NotFound } from '../../src/utils/error.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authorisation/index.js')

const ResponseModelMock = getTypedModelMock('ResponseModel')
const ReleaseModelMock = getTypedModelMock('ReleaseModel')
const ReviewModelMock = getTypedModelMock('ReviewModel')

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

const mockReviewService = vi.hoisted(() => {
  return {
    createReleaseReviews: vi.fn(),
    removeReleaseReviews: vi.fn(),
  }
})
vi.mock('../../src/services/review.js', () => mockReviewService)

const mockResponseService = vi.hoisted(() => {
  return {
    removeResponsesByParentIds: vi.fn(),
  }
})
vi.mock('../../src/services/response.js', () => mockResponseService)

const mockWebhookService = vi.hoisted(() => {
  return {
    sendWebhooks: vi.fn(),
  }
})
vi.mock('../../src/services/webhook.js', () => mockWebhookService)

describe('services > release', () => {
  test('createRelease > simple', async () => {
    ReleaseModelMock.findOne.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0', minor: false } as any)

    expect(ReleaseModelMock.save).toBeCalled()
    expect(ReleaseModelMock).toBeCalled()
    expect(mockReviewService.createReleaseReviews).toBeCalled()
    expect(mockWebhookService.sendWebhooks).toBeCalled()
  })

  test('createRelease > minor release', async () => {
    ReleaseModelMock.findOne.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0', minor: true } as any)

    expect(ReleaseModelMock.save).toBeCalled()
    expect(ReleaseModelMock).toBeCalled()
    expect(mockReviewService.createReleaseReviews).not.toBeCalled()
  })

  test('createRelease > release with image', async () => {
    const existingImages = [{ repository: 'mockRep', name: 'image', tags: ['latest'] }]
    registryMocks.listModelImages.mockResolvedValueOnce(existingImages)

    ReleaseModelMock.findOne.mockResolvedValue(null)

    await createRelease(
      {} as any,
      {
        semver: 'v1.0.0',
        images: existingImages.flatMap(({ tags, ...rest }) => tags.map((tag) => ({ tag, ...rest }))),
      } as any,
    )

    expect(ReleaseModelMock.save).toBeCalled()
    expect(ReleaseModelMock).toBeCalled()
    expect(mockReviewService.createReleaseReviews).toBeCalled()
  })

  test('createRelease > missing images in the registry', async () => {
    const existingImages = [{ repository: 'mockRep', name: 'image', tags: ['latest'] }]
    registryMocks.listModelImages.mockResolvedValueOnce(existingImages)
    ReleaseModelMock.findOne.mockResolvedValue(null)

    await expect(() =>
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
    expect(ReleaseModelMock.save).not.toBeCalled()
    expect(mockReviewService.createReleaseReviews).not.toBeCalled()
  })

  test('createRelease > release with bad files', async () => {
    fileMocks.getFileById.mockResolvedValueOnce({ modelId: 'random_model' })
    ReleaseModelMock.findOne.mockResolvedValue(null)

    await expect(() =>
      createRelease(
        {} as any,
        {
          semver: 'v1.0.0',
          modelCardVersion: 999,
          fileIds: ['test'],
        } as any,
      ),
    ).rejects.toThrowError(/^The file 'test' comes from the model/)

    expect(ReleaseModelMock.save).not.toBeCalled()
  })

  test('createRelease > release with bailo error', async () => {
    fileMocks.getFileById.mockRejectedValueOnce(NotFound('File not found.'))
    ReleaseModelMock.findOne.mockResolvedValue(null)

    await expect(() =>
      createRelease(
        {} as any,
        {
          semver: 'v1.0.0',
          modelCardVersion: 999,
          fileIds: ['test'],
        } as any,
      ),
    ).rejects.toThrowError(/^Unable to create release as the file cannot be found./)

    expect(ReleaseModelMock.save).not.toBeCalled()
  })

  test('createRelease > release with generic error', async () => {
    fileMocks.getFileById.mockRejectedValueOnce(Error('File not found.'))
    ReleaseModelMock.findOne.mockResolvedValue(null)

    await expect(() =>
      createRelease(
        {} as any,
        {
          semver: 'v1.0.0',
          modelCardVersion: 999,
          fileIds: ['test'],
        } as any,
      ),
    ).rejects.toThrowError(/^File not found./)

    expect(ReleaseModelMock.save).not.toBeCalled()
  })

  test('createRelease > release with duplicate file names', async () => {
    fileMocks.getFileById.mockResolvedValue({ modelId: 'test_model_id', name: 'test_file.png' })
    modelMocks.getModelById.mockResolvedValue({
      id: 'test_model_id',
      card: { version: 1 },
      settings: { mirror: { sourceModelId: '' } },
    })
    ReleaseModelMock.findOne.mockResolvedValue(null)

    await expect(
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

    expect(ReleaseModelMock.save).not.toBeCalled()
  })

  test('createRelease > release with bad semver', async () => {
    ReleaseModelMock.findOne.mockResolvedValue(null)
    const result = createRelease(
      {} as any,
      {
        semver: 'bad semver',
        modelCardVersion: 999,
      } as any,
    )
    await expect(result).rejects.toThrowError(/is not a valid semver value./)

    expect(ReleaseModelMock.save).not.toBeCalled()
  })

  test('createRelease > bad authorisation', async () => {
    vi.mocked(authorisation.release).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    ReleaseModelMock.findOne.mockResolvedValue(null)
    await expect(() => createRelease({} as any, { semver: 'v1.0.0' } as any)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('createRelease > automatic model card version', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({
      id: 'test_model_id',
      card: { version: 999 },
      settings: { mirror: { sourceModelId: '' } },
    })
    ReleaseModelMock.findOne.mockResolvedValue(null)

    await createRelease({} as any, { semver: 'v1.0.0' } as any)

    expect(ReleaseModelMock.save).toBeCalled()
    expect(ReleaseModelMock.mock.calls.at(0)?.at(0)?.modelCardVersion).toBe(999)
  })

  test('createRelease > no model card', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({
      id: 'test_model_id',
      card: undefined as any,
      settings: { mirror: { sourceModelId: '' } },
    })

    await expect(() => createRelease({} as any, { semver: 'v1.0.0' } as any)).rejects.toThrowError(
      /^This model does not have a model card associated with it/,
    )

    expect(ReleaseModelMock.save).not.toBeCalled()
  })

  test('createRelease > should throw Bad Req if the user tries to alter a mirrored model card', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({
      id: 'test_model_id',
      card: { version: 1 },
      settings: { mirror: { sourceModelId: '123' } },
    })

    await expect(() => createRelease({} as any, { semver: 'v1.0.0' } as any)).rejects.toThrowError(
      /^Cannot create a release from a mirrored model/,
    )
  })

  test('updateRelease > bad authorisation', async () => {
    vi.mocked(authorisation.release).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })
    await expect(() => updateRelease({} as any, 'model-id', 'v1.0.0', {} as any)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('updateRelease > release with bad files', async () => {
    fileMocks.getFileById.mockResolvedValueOnce({ modelId: 'random_model' })

    await expect(() =>
      updateRelease({} as any, 'model-id', 'v1.0.0', {
        semver: 'v1.0.0',
        fileIds: ['test'],
      } as any),
    ).rejects.toThrowError(/^The file 'test' comes from the model/)
  })

  test('updateRelease > success', async () => {
    ReleaseModelMock.findOne.mockResolvedValue({ semver: 'v1.0.0' })

    await updateRelease({} as any, 'model-id', 'v1.0.0', { notes: 'New notes' } as any)

    expect(ReleaseModelMock.findOneAndUpdate).toBeCalled()
  })

  test('updateRelease > should throw Bad Req when attempting to update a release on a mirrored model ', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({
      id: 'test_model_id',
      card: { version: 1 },
      settings: { mirror: { sourceModelId: '123' } },
    })

    await expect(() => updateRelease({} as any, 'model-id', 'v1.0.0', {} as any)).rejects.toThrowError(
      /^Cannot update a release on a mirrored model./,
    )
  })

  test('validateRelease > should not call listModelImages', async () => {
    registryMocks.listModelImages.mockResolvedValueOnce([{ repository: 'mockRep', name: 'image', tags: ['latest'] }])

    await validateRelease({ dn: 'dn' }, {} as any, { semver: '1.1.1', images: [], modelId: 'test-modelId' } as any)

    expect(listModelImages).not.toHaveBeenCalled()
  })

  test('newReleaseComment > success', async () => {
    ReleaseModelMock.findOneAndUpdate.mockResolvedValue({})

    await newReleaseComment({} as any, 'model', '1.0.0', 'This is a new comment')

    expect(ResponseModelMock.save).toBeCalled()
  })

  test('newReleaseComment > should throw bad request when attempting to create a release comment on a mirrored model', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({
      id: 'test_model_id',
      card: { version: 1 },
      settings: { mirror: { sourceModelId: '123' } },
    })

    await expect(() => newReleaseComment({} as any, 'model', '1.0.0', 'This is a new comment')).rejects.toThrowError(
      /^Cannot create a new comment on a mirrored model./,
    )
    expect(ReleaseModelMock.findOneAndUpdate).not.toBeCalled()
  })

  test('getModelReleases > good', async () => {
    vi.mocked(ReleaseModelMock.append).mockReturnValueOnce([])
    await getModelReleases({ dn: 'user' } as UserInterface, 'modelId')

    expect(ReleaseModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReleaseModelMock.sort.mock.calls.at(0)).toMatchSnapshot()
    expect(ReleaseModelMock.lookup.mock.calls.at(0)).toMatchSnapshot()
    expect(ReleaseModelMock.append.mock.calls.at(0)).toMatchSnapshot()
  })

  test('semverObjectToString > deals with edge cases', async () => {
    const semObj: SemverObject = {
      major: 1,
      minor: 1,
      patch: 1,
      metadata: 'test',
    }
    const semObj2: SemverObject = {
      major: 1,
      minor: 1,
      patch: 1,
    }
    expect(semverObjectToString(semObj)).toBe('1.1.1-test')
    expect(semverObjectToString(undefined as any)).toBe('')
    expect(semverObjectToString(semObj2)).toBe('1.1.1')
  })

  test('getModelReleases > convertSemverQueryToMongoQuery functions', async () => {
    vi.mocked(ReleaseModelMock.append).mockReturnValueOnce([])
    await getModelReleases({ dn: 'user' } as UserInterface, 'modelId', '2.2.X')
    expect(ReleaseModelMock.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('getModelReleases > convertSemverQueryToMongoQuery functions with less than', async () => {
    vi.mocked(ReleaseModelMock.append).mockReturnValueOnce([])
    await getModelReleases({ dn: 'user' } as UserInterface, 'modelID', '<2.2.2')
    expect(ReleaseModelMock.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('convertSemverQueryToMongoQuery > convertSemverQueryToMongoQuery handles bad semver', async () => {
    await expect(
      async () => await getModelReleases({ dn: 'user' } as UserInterface, 'test', '^2.2v.x'),
    ).rejects.toThrowError(/^Semver range is invalid./)
  })

  test('getReleaseBySemver > good', async () => {
    const mockRelease = { _id: 'release' }

    ReleaseModelMock.findOne.mockResolvedValue(mockRelease)

    expect(await getReleaseBySemver({} as any, 'test', 'test')).toBe(mockRelease)
  })

  test('getReleaseBySemver > no release', async () => {
    ReleaseModelMock.findOne.mockResolvedValue(undefined)

    await expect(() => getReleaseBySemver({} as any, 'test', 'test')).rejects.toThrowError(
      /^The requested release was not found./,
    )
  })

  test('getReleaseBySemver > no permission', async () => {
    const mockRelease = { _id: 'release' }

    ReleaseModelMock.findOne.mockResolvedValue(mockRelease)
    vi.mocked(authorisation.release).mockResolvedValue({
      info: 'You do not have permission to view this release.',
      success: false,
      id: '',
    })

    await expect(() => getReleaseBySemver({} as any, 'test', 'test')).rejects.toThrowError(
      /^You do not have permission to view this release./,
    )
  })

  test('deleteRelease > success', async () => {
    ReviewModelMock.find.mockResolvedValue([])
    expect(await deleteRelease({} as any, 'test', 'test')).toStrictEqual({ modelId: 'test', semver: 'test' })
  })

  describe('deleteReleases', () => {
    test('success', async () => {
      ReviewModelMock.find.mockResolvedValue([])

      expect(await deleteReleases({} as any, 'test', ['test1', 'test2'])).toStrictEqual({
        modelId: 'test',
        semvers: ['test1', 'test2'],
      })
      expect(ReleaseModelMock.delete).toBeCalledTimes(2)
    })

    test('no permission', async () => {
      const mockRelease = { _id: 'release' }

      ReleaseModelMock.findOne.mockResolvedValue(mockRelease)

      vi.mocked(authorisation.release).mockImplementation(async (_user, _model, action, _release) => {
        if (action === ReleaseAction.View) {
          return { success: true, id: '' }
        }
        if (action === ReleaseAction.Delete) {
          return { success: false, info: 'You do not have permission to delete this release.', id: '' }
        }

        return { success: false, info: 'Unknown action.', id: '' }
      })

      await expect(() => deleteReleases({} as any, 'test', ['test'])).rejects.toThrowError(
        /^You do not have permission to delete this release./,
      )
      expect(ReleaseModelMock.save).not.toBeCalled()
    })

    test('success bypass mirrored model check', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        id: 'test_model_id',
        card: { version: 1 },
        settings: { mirror: { sourceModelId: '123' } },
      })
      ReviewModelMock.find.mockResolvedValue([])

      expect(await deleteReleases({} as any, 'test', ['test1', 'test2'], true)).toStrictEqual({
        modelId: 'test',
        semvers: ['test1', 'test2'],
      })
      expect(ReleaseModelMock.delete).toBeCalledTimes(2)
    })

    test('throw on mirrored model', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        id: 'test_model_id',
        card: { version: 1 },
        settings: { mirror: { sourceModelId: '123' } },
      })

      await expect(() => deleteReleases({} as any, 'test', ['test'])).rejects.toThrowError(
        /^Cannot delete a release on a mirrored model./,
      )
    })
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

    ReleaseModelMock.find.mockResolvedValueOnce([mockRelease, mockRelease])

    const result = removeFileFromReleases(mockUser, mockModel, '')

    await expect(result).rejects.toThrowError(/^You do not have permission to update these releases./)
    expect(ReleaseModelMock.updateMany).not.toBeCalled()
  })

  test('removeFileFromReleases > success', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModel: any = { id: 'test', settings: { mirror: { sourceModelId: '' } } }
    const mockRelease = { _id: 'release' }
    const resultObject = { modifiedCount: 2, matchedCount: 2 }

    ReleaseModelMock.find.mockResolvedValueOnce([mockRelease, mockRelease])
    ReleaseModelMock.updateMany.mockResolvedValueOnce(resultObject)

    const result = await removeFileFromReleases(mockUser, mockModel, '')

    expect(result).toEqual(resultObject)
  })

  test('removeFileFromReleases > should throw a bad req when attempting to remove a file from a mirrored model', async () => {
    const mockUser: any = { dn: 'test' }
    const mockModel: any = { id: 'test', settings: { mirror: { sourceModelId: '123' } } }

    await expect(() => removeFileFromReleases(mockUser, mockModel, '123')).rejects.toThrowError(
      /^Cannot remove a file from a mirrored model./,
    )
    expect(ReleaseModelMock.delete).not.toBeCalled()
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
    await expect(result).rejects.toThrowError(/^The requested file name was not found on the release./)
  })

  test('getReleasesForExport > release not found', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const semvers = ['1.0.0']
    ReleaseModelMock.find.mockResolvedValueOnce([])

    const result = getReleasesForExport(mockUser, modelId, semvers)

    await expect(result).rejects.toThrowError(/^The following releases were not found./)
  })

  test('getReleasesForExport > release not found', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const semvers = ['1.0.0']
    ReleaseModelMock.find.mockResolvedValueOnce([{ semver: '1.0.0' }])
    vi.mocked(authorisation.releases).mockResolvedValue([
      { info: 'You do not have permission', success: false, id: '' },
    ])

    const result = getReleasesForExport(mockUser, modelId, semvers)

    await expect(result).rejects.toThrowError(/^You do not have the necessary permissions to export these releases./)
  })

  test('getReleasesForExport > return releases', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const semvers = ['1.0.0']
    const releases = [{ semver: '1.0.0' }]
    ReleaseModelMock.find.mockResolvedValueOnce(releases)

    const result = await getReleasesForExport(mockUser, modelId, semvers)

    expect(result).toBe(releases)
  })

  test('getTotalFileSize > returns fileIds', async () => {
    ReleaseModelMock.group.mockResolvedValueOnce([{ fileIds: [42] }])
    const size = await getAllFileIds('example', ['1', '2', '3'])

    expect(size).toStrictEqual([42])
  })

  test('getTotalFileSize > returns empty list if no file Ids', async () => {
    ReleaseModelMock.group.mockResolvedValueOnce([])
    const size = await getAllFileIds('example', ['1', '2', '3'])

    expect(size).toStrictEqual([])
  })

  test('isReleaseDoc > success', async () => {
    const result = isReleaseDoc({
      modelId: '',
      modelCardVersion: 1,
      semver: '',
      notes: '',
      minor: false,
      draft: false,
      fileIds: ['id1'],
      images: [{ repository: 'repo', name: 'name', tag: 'tag', _id: '' }],
      deleted: false,
      createdBy: '',
      createdAt: '',
      updatedAt: '',
      _id: '',
    })

    expect(result).toBe(true)
  })

  test('isReleaseDoc > missing property', async () => {
    const result = isReleaseDoc({
      modelId: '',
      modelCardVersion: 1,
      notes: '',
      minor: false,
      draft: false,
      fileIds: ['id1'],
      images: [{ repository: 'repo', name: 'name', tag: 'tag', _id: '' }],
      deleted: false,
      createdBy: '',
      createdAt: '',
      updatedAt: '',
      _id: '',
    })

    expect(result).toBe(false)
  })

  test('isReleaseDoc > wrong type', async () => {
    const result = isReleaseDoc(null)

    expect(result).toBe(false)
  })

  test('findAndDeleteImageFromReleases > success', async () => {
    const mockUser: any = { dn: 'test' }
    const modelId = 'example'
    const imageRef = { repository: 'repository', name: 'name', tag: 'tag' }

    await findAndDeleteImageFromReleases(mockUser, modelId, imageRef)

    expect(modelMocks.getModelById).toHaveBeenCalledWith(mockUser, modelId)
    expect(ReleaseModelMock.updateMany).toHaveBeenCalledWith(
      { modelId },
      {
        $pull: {
          images: { ...imageRef },
        },
      },
      {
        session: undefined,
      },
    )
  })
})
