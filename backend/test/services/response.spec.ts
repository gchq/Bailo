import { describe, expect, test, vi } from 'vitest'

import { Decision, ReactionKind } from '../../src/models/Response.js'
import {
  checkAccessRequestsApproved,
  findResponseById,
  getResponsesByParentIds,
  respondToReview,
  updateResponse,
  updateResponseReaction,
} from '../../src/services/response.js'
import { ReviewKind } from '../../src/types/enums.js'
import { testAccessRequestReview, testReleaseReview } from '../testUtils/testModels.js'

vi.mock('../../src/connectors/authorisation/index.js')
vi.mock('../../src/connectors/authentication/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

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

const smtpMock = vi.hoisted(() => ({
  notifyReviewResponseForAccess: vi.fn(() => Promise.resolve()),
  notifyReviewResponseForRelease: vi.fn(() => Promise.resolve()),
  requestReviewForRelease: vi.fn(() => Promise.resolve()),
  requestReviewForAccessRequest: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../src/services/smtp/smtp.js', async () => smtpMock)

const reviewMock = vi.hoisted(() => ({
  findReviewsForAccessRequests: vi.fn(() => [testReleaseReview]),
  findReviewForResponse: vi.fn(() => testReleaseReview),
}))
vi.mock('../../src/services/review.js', async () => reviewMock)

const accessRequestServiceMock = vi.hoisted(() => ({
  getAccessRequestById: vi.fn(),
}))
vi.mock('../../src/services/accessRequest.js', async () => accessRequestServiceMock)

const releaseServiceMock = vi.hoisted(() => ({
  getReleaseBySemver: vi.fn(),
}))
vi.mock('../../src/services/release.js', async () => releaseServiceMock)

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))
const arrayUtilMock = vi.hoisted(() => ({
  asyncFilter: vi.fn(),
}))
vi.mock('../../src/utils/array.js', async () => arrayUtilMock)
const entityUtilMock = vi.hoisted(() => ({
  toEntity: vi.fn(),
}))
vi.mock('../../src/utils/entity.js', () => entityUtilMock)

const mockWebhookService = vi.hoisted(() => {
  return {
    sendWebhooks: vi.fn(),
  }
})
vi.mock('../../src/services/webhook.js', () => mockWebhookService)

describe('services > response', () => {
  const user: any = { dn: 'test' }

  test('findResponseById > success', async () => {
    const mockResponse = { _id: 'response' }

    responseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    expect(await findResponseById('test')).toBe(mockResponse)
  })
  test('findResponseById > response not found', async () => {
    responseModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(findResponseById('test')).rejects.toThrowError('The requested response was not found.')
  })

  test('getResponsesByParentIds > success', async () => {
    const mockResponses = [{ _id: 'response' }]

    responseModelMock.find.mockResolvedValueOnce(mockResponses)

    expect(await getResponsesByParentIds({} as any, ['test'])).toBe(mockResponses)
  })
  test('getResponsesByParentIds > response not found', async () => {
    responseModelMock.find.mockResolvedValueOnce(undefined)

    await expect(getResponsesByParentIds({} as any, ['test'])).rejects.toThrowError(
      'The requested response was not found.',
    )
  })

  test('updateResponse > success', async () => {
    const date = new Date(1970, 0, 1, 0)
    vi.setSystemTime(date)

    const mockResponse = { _id: 'response', entity: 'user:user', comment: 'test', save: vi.fn() }
    const mockUpdatedResponse = { ...mockResponse, comment: 'updated', commentEditedAt: date.toISOString() }

    responseModelMock.findOne.mockResolvedValueOnce(mockResponse)
    entityUtilMock.toEntity.mockReturnValueOnce('user:user')

    const updatedResponse = await updateResponse({} as any, 'test', 'updated')

    expect(updatedResponse).toEqual(mockUpdatedResponse)
    expect(mockResponse.save).toBeCalled()
  })
  test('updateResponse > response not found', async () => {
    responseModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(updateResponse({} as any, 'test', 'updated')).rejects.toThrowError(
      'The requested response was not found.',
    )
  })
  test('updateResponse > invalid user', async () => {
    const mockResponse = { _id: 'response', entity: 'user:user', comment: 'test', save: vi.fn() }

    responseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    await expect(updateResponse({} as any, 'test', 'updated')).rejects.toThrowError(
      'Only the original author can update a comment or review response.',
    )
  })

  test('updateResponseReaction > should add reaction when no reactions of the same kind exist', async () => {
    const mockResponse = { _id: 'response', reactions: [], save: vi.fn() }
    const mockUpdatedResponse = {
      ...mockResponse,
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: ['user'],
        },
      ],
    }

    responseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    expect(await updateResponseReaction({ dn: 'user' } as any, 'test', ReactionKind.LIKE)).toEqual(mockUpdatedResponse)
    expect(mockResponse.save).toBeCalled()
  })
  test('updateResponseReaction > should remove user from reaction users array when a reaction of the same kind exists and user is present in users array', async () => {
    const mockResponse = {
      _id: 'response',
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: ['user'],
        },
      ],
      save: vi.fn(),
    }
    const mockUpdatedResponse = {
      ...mockResponse,
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: [],
        },
      ],
    }

    responseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    expect(await updateResponseReaction({ dn: 'user' } as any, 'test', ReactionKind.LIKE)).toEqual(mockUpdatedResponse)
    expect(mockResponse.save).toBeCalled()
  })
  test(`updateResponseReaction > should add user to reaction users array when a reaction of the same kind exists and user is not present in users array`, async () => {
    const mockResponse = {
      _id: 'response',
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: [],
        },
      ],
      save: vi.fn(),
    }
    const mockUpdatedResponse = {
      ...mockResponse,
      reactions: [
        {
          kind: ReactionKind.LIKE,
          users: ['user'],
        },
      ],
    }

    responseModelMock.findOne.mockResolvedValueOnce(mockResponse)

    expect(await updateResponseReaction({ dn: 'user' } as any, 'test', ReactionKind.LIKE)).toEqual(mockUpdatedResponse)
    expect(mockResponse.save).toBeCalled()
  })
  test('updateResponseReaction > response not found', async () => {
    responseModelMock.findOne.mockResolvedValueOnce(undefined)

    await expect(updateResponseReaction({} as any, 'test', ReactionKind.LIKE)).rejects.toThrowError(
      'The requested response was not found.',
    )
  })

  test('respondToReview > release successful', async () => {
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )

    expect(responseModelMock.save).toHaveBeenCalledOnce()
    expect(smtpMock.notifyReviewResponseForRelease).toHaveBeenCalledOnce()
    expect(releaseServiceMock.getReleaseBySemver).toHaveBeenCalledOnce()
    expect(mockWebhookService.sendWebhooks).toHaveBeenCalledOnce()
  })

  test('respondToReview > access request successful', async () => {
    reviewMock.findReviewForResponse.mockReturnValueOnce(testAccessRequestReview as any)
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Access,
      'accessRequestId',
    )

    expect(responseModelMock.save).toHaveBeenCalledOnce()
    expect(smtpMock.notifyReviewResponseForAccess).toHaveBeenCalledOnce()
    expect(accessRequestServiceMock.getAccessRequestById).toHaveBeenCalledOnce()
    expect(mockWebhookService.sendWebhooks).toHaveBeenCalledOnce()
  })

  test('respondToReview > unable to send notification due to missing access request ID', async () => {
    reviewMock.findReviewForResponse.mockReturnValueOnce({ kind: 'access' } as any)
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Access,
      'accessRequestId',
    )

    expect(logMock.error).toHaveBeenCalledWith(
      { review: { kind: 'access' } },
      'Unable to send notification for review response. Cannot find access request ID.',
    )
  })

  test('respondToReview > log when failed to send access request response notification', async () => {
    reviewMock.findReviewForResponse.mockReturnValueOnce(testAccessRequestReview as any)
    smtpMock.notifyReviewResponseForAccess.mockRejectedValueOnce('failed to send')
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Access,
      'accessRequestId',
    )
    // Allow for completion of asynchronous content
    await new Promise((r) => setTimeout(r))

    expect(responseModelMock.save).toHaveBeenCalledOnce()
    expect(accessRequestServiceMock.getAccessRequestById).toHaveBeenCalledOnce()
    expect(mockWebhookService.sendWebhooks).toHaveBeenCalledOnce()
    expect(logMock.warn).toHaveBeenCalledOnce()
  })

  test('respondToReview > log when failed to send release response notification', async () => {
    smtpMock.notifyReviewResponseForRelease.mockRejectedValueOnce('failed to send')
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )
    // Allow for completion of asynchronous content
    await new Promise((r) => setTimeout(r))

    expect(responseModelMock.save).toHaveBeenCalledOnce()
    expect(smtpMock.notifyReviewResponseForRelease).toHaveBeenCalledOnce()
    expect(releaseServiceMock.getReleaseBySemver).toHaveBeenCalledOnce()
    expect(mockWebhookService.sendWebhooks).toHaveBeenCalledOnce()
    expect(logMock.warn).toHaveBeenCalledOnce()
  })

  test('respondToReview > missing semver', async () => {
    reviewMock.findReviewForResponse.mockReturnValueOnce({ kind: 'release' } as any)
    await respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )

    expect(logMock.error).toHaveBeenCalledWith(
      {
        review: { kind: 'release' },
      },
      'Unable to send notification for review response. Cannot find semver.',
    )
  })

  test('respondToReview > no reviews found', async () => {
    reviewMock.findReviewForResponse.mockRejectedValueOnce('Unable to find Review to respond to')

    const result = respondToReview(
      user,
      'modelId',
      'msro',
      {
        decision: Decision.RequestChanges,
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )

    await expect(result).rejects.toThrowError(`Unable to find Review to respond to`)
    expect(responseModelMock.save).not.toBeCalled()
  })

  test('checkAccessRequestsApproved > approved access request exists', async () => {
    reviewMock.findReviewsForAccessRequests.mockReturnValueOnce([{ role: 'msro' }, { role: 'random' }] as any)
    responseModelMock.find.mockReturnValueOnce(['approved'])

    const result = await checkAccessRequestsApproved(['access-1', 'access-2'])

    expect(result).toBe(true)
    expect(reviewMock.findReviewsForAccessRequests.mock.calls).toMatchSnapshot()
  })

  test('checkAccessRequestsApproved > no approved access requests with a required role', async () => {
    reviewMock.findReviewsForAccessRequests.mockReturnValueOnce([{ role: 'random' }] as any)

    const result = await checkAccessRequestsApproved(['access-1', 'access-2'])

    expect(result).toBe(false)
    expect(reviewMock.findReviewsForAccessRequests.mock.calls).toMatchSnapshot()
  })
})
