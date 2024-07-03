import { describe, expect, test, vi } from 'vitest'

import { Decision } from '../../src/models/Response.js'
import { checkAccessRequestsApproved, respondToReview } from '../../src/services/response.js'
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

const mockWebhookService = vi.hoisted(() => {
  return {
    sendWebhooks: vi.fn(),
  }
})
vi.mock('../../src/services/webhook.js', () => mockWebhookService)

describe('services > response', () => {
  const user: any = { dn: 'test' }

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

    expect(result).rejects.toThrowError(`Unable to find Review to respond to`)
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
