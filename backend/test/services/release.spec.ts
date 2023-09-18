import { describe, expect, test, vi } from 'vitest'

import { createRelease, deleteRelease, getModelReleases, getReleaseBySemver } from '../../src/services/v2/release.js'

const arrayAsyncFilter = vi.hoisted(() => ({
  asyncFilter: vi.fn(() => []),
}))
vi.mock('../../src/utils/v2/array.js', () => arrayAsyncFilter)

const authorisationMocks = vi.hoisted(() => ({
  userReleaseAction: vi.fn(() => true),
}))
vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  ...((await vi.importActual('../../src/connectors/v2/authorisation/index.js')) as object),
  default: authorisationMocks,
}))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/v2/model.js', () => modelMocks)

const releaseModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/Release.js', () => ({ default: releaseModelMocks }))

const mockReviewService = vi.hoisted(() => {
  return {
    createReleaseReviews: vi.fn(),
  }
})
vi.mock('../../src/services/v2/review.js', () => mockReviewService)

describe('services > release', () => {
  test('createRelease > simple', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)

    await createRelease({} as any, {} as any)

    expect(releaseModelMocks.save).toBeCalled()
    expect(releaseModelMocks).toBeCalled()
    expect(mockReviewService.createReleaseReviews).toBeCalled()
  })

  test('createRelease > bad authorisation', async () => {
    authorisationMocks.userReleaseAction.mockResolvedValueOnce(false)
    expect(() => createRelease({} as any, {} as any)).rejects.toThrowError(/^You do not have permission/)
  })

  test('getModelReleases > good', async () => {
    await getModelReleases({} as any, 'modelId')

    expect(releaseModelMocks.match.mock.calls.at(0)).toMatchSnapshot()
    expect(releaseModelMocks.sort.mock.calls.at(0)).toMatchSnapshot()
    expect(releaseModelMocks.lookup.mock.calls.at(0)).toMatchSnapshot()
    expect(releaseModelMocks.append.mock.calls.at(0)).toMatchSnapshot()
  })

  test('getReleaseBySemver > good', async () => {
    const mockRelease = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOne.mockResolvedValue(mockRelease)
    authorisationMocks.userReleaseAction.mockResolvedValueOnce(true)

    expect(await getReleaseBySemver({} as any, 'test', 'test')).toBe(mockRelease)
  })

  test('getReleaseBySemver > no release', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOne.mockResolvedValue(undefined)
    authorisationMocks.userReleaseAction.mockResolvedValueOnce(true)

    expect(() => getReleaseBySemver({} as any, 'test', 'test')).rejects.toThrowError(
      /^The requested release was not found./
    )
  })

  test('getReleaseBySemver > no permission', async () => {
    const mockRelease = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOne.mockResolvedValue(mockRelease)
    authorisationMocks.userReleaseAction.mockResolvedValueOnce(false)

    expect(() => getReleaseBySemver({} as any, 'test', 'test')).rejects.toThrowError(
      /^You do not have permission to view this release./
    )
  })

  test('deleteRelease > success', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    authorisationMocks.userReleaseAction.mockResolvedValueOnce(true)

    expect(await deleteRelease({} as any, 'test', 'test')).toStrictEqual({ modelId: 'test', semver: 'test' })
  })

  test('deleteRelease > no permission', async () => {
    const mockRelease = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
    releaseModelMocks.findOne.mockResolvedValue(mockRelease)

    authorisationMocks.userReleaseAction.mockResolvedValueOnce(true)
    authorisationMocks.userReleaseAction.mockResolvedValueOnce(false)

    expect(() => deleteRelease({} as any, 'test', 'test')).rejects.toThrowError(
      /^You do not have permission to delete this release./
    )
    expect(releaseModelMocks.save).not.toBeCalled()
  })
})
