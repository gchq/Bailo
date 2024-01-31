import { describe, expect, test, vi } from 'vitest'

import AccessRequest from '../../src/models/v2/AccessRequest.js'
import Model from '../../src/models/v2/Model.js'
import Release from '../../src/models/v2/Release.js'
import { Decision, ReviewDoc, ReviewInterface } from '../../src/models/v2/Review.js'
import {
  createAccessRequestReviews,
  createReleaseReviews,
  findReviews,
  respondToReview,
  sendReviewResponseNotification,
} from '../../src/services/v2/review.js'
import { ReviewKind } from '../../src/types/v2/enums.js'

vi.mock('../../src/connectors/v2/authorisation/index.js')
vi.mock('../../src/connectors/v2/authentication/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const reviewModelMock = vi.hoisted(() => {
  const obj: any = { kind: 'access', accessRequestId: 'Hello' }

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
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
vi.mock('../../src/models/v2/Review.js', async () => ({
  ...((await vi.importActual('../../src/models/v2/Review.js')) as object),
  default: reviewModelMock,
}))

const smtpMock = vi.hoisted(() => ({
  notifyReviewResponseForAccess: vi.fn(),
  notifyReviewResponseForRelease: vi.fn(),
  requestReviewForRelease: vi.fn(),
  requestReviewForAccessRequest: vi.fn(),
}))
vi.mock('../../src/services/v2/smtp/smtp.js', async () => smtpMock)

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/v2/model.js', async () => modelMock)

const accessRequestServiceMock = vi.hoisted(() => ({
  getAccessRequestById: vi.fn(),
}))
vi.mock('../../src/services/v2/accessRequest.js', async () => accessRequestServiceMock)

const releaseRequestServiceMock = vi.hoisted(() => ({
  getReleaseBySemver: vi.fn(),
}))
vi.mock('../../src/services/v2/release.js', async () => releaseRequestServiceMock)

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/v2/log.js', async () => ({
  default: logMock,
}))
const arrayUtilMock = vi.hoisted(() => ({
  asyncFilter: vi.fn(),
}))
vi.mock('../../src/utils/v2/array.js', async () => arrayUtilMock)

const mockWebhookService = vi.hoisted(() => {
  return {
    sendWebhooks: vi.fn(),
  }
})
vi.mock('../../src/services/v2/webhook.js', () => mockWebhookService)

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviews > active', async () => {
    await findReviews(user)

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviews > active reviews for a specific model', async () => {
    await findReviews(user, 'modelId')

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('createReleaseReviews > No entities found for required roles', async () => {
    const result: Promise<void> = createReleaseReviews(new Model(), new Release())

    expect(result).rejects.toThrowError(`Could not find any entities for the role`)
    expect(reviewModelMock.save).not.toBeCalled()
  })

  test('createReleaseReviews > successful', async () => {
    await createReleaseReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new Release(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForRelease).toBeCalled()
  })

  test('createReleaseReviews > unable to send notification', async () => {
    const err = Error('test error')
    smtpMock.requestReviewForRelease.mockImplementationOnce(() => {
      throw err
    })
    await createReleaseReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new Release(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForRelease).toBeCalled()
    expect(logMock.warn).toHaveBeenCalledWith('Error when sending notifications requesting review for release.', {
      error: err,
    })
  })

  test('createAccessRequestReviews > successful', async () => {
    await createAccessRequestReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new AccessRequest(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForAccessRequest).toBeCalled()
  })

  test('createAccessRequestReviews > unable to send notification', async () => {
    const err = Error('test error')
    smtpMock.requestReviewForAccessRequest.mockImplementationOnce(() => {
      throw err
    })
    await createAccessRequestReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new AccessRequest(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForAccessRequest).toBeCalled()
    expect(logMock.warn).toHaveBeenCalledWith(
      'Error when sending notifications requesting review for Access Request.',
      {
        error: err,
      },
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

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.match.mock.calls.at(1)).toMatchSnapshot()
    expect(reviewModelMock.findByIdAndUpdate).toBeCalled()
    expect(mockWebhookService.sendWebhooks).toBeCalled()
  })

  test('respondToReview > access request successful', async () => {
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

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.match.mock.calls.at(1)).toMatchSnapshot()
    expect(reviewModelMock.findByIdAndUpdate).toBeCalled()
  })

  test('respondToReview > access request review  response notification successful', async () => {
    accessRequestServiceMock.getAccessRequestById.mockReturnValueOnce({ createdBy: 'Yellow' })
    await sendReviewResponseNotification({ kind: 'access', accessRequestId: 'Hello' } as ReviewDoc, user)

    expect(accessRequestServiceMock.getAccessRequestById).toBeCalled()
    expect(smtpMock.notifyReviewResponseForAccess).toBeCalled()
  })

  test('respondToReview > access request review response notification error', async () => {
    releaseRequestServiceMock.getReleaseBySemver.mockReturnValueOnce({ createdBy: 'Yellow' })
    const err = Error('test error')
    smtpMock.notifyReviewResponseForAccess.mockImplementationOnce(() => {
      throw err
    })
    await sendReviewResponseNotification({ kind: 'access', accessRequestId: 'Hello' } as ReviewDoc, user)

    expect(accessRequestServiceMock.getAccessRequestById).toBeCalled()
    expect(smtpMock.notifyReviewResponseForAccess).toBeCalled()
    expect(logMock.warn).toHaveBeenCalledWith('Error when notifying collaborators about review response.', {
      error: err,
    })
  })

  test('respondToReview > missing access request ID', async () => {
    releaseRequestServiceMock.getReleaseBySemver.mockReturnValueOnce({ createdBy: 'Yellow' })
    const err = Error('test error')
    smtpMock.notifyReviewResponseForAccess.mockImplementationOnce(() => {
      throw err
    })
    await sendReviewResponseNotification({ kind: 'access' } as ReviewDoc, user)

    expect(logMock.error).toHaveBeenCalledWith(
      'Unable to send notification for review response. Cannot find access request ID.',
    )
  })

  test('respondToReview > release review response notification successful', async () => {
    releaseRequestServiceMock.getReleaseBySemver.mockReturnValueOnce({ createdBy: 'Yellow' })
    await sendReviewResponseNotification({ kind: 'release', semver: 'Hello' } as ReviewDoc, user)

    expect(releaseRequestServiceMock.getReleaseBySemver).toBeCalled()
    expect(smtpMock.notifyReviewResponseForRelease).toBeCalled()
  })

  test('respondToReview > missing semver', async () => {
    releaseRequestServiceMock.getReleaseBySemver.mockReturnValueOnce({ createdBy: 'Yellow' })
    await sendReviewResponseNotification({ kind: 'release' } as ReviewDoc, user)

    expect(logMock.error).toHaveBeenCalledWith('Unable to send notification for review response. Cannot find semver.')
  })

  test('respondToReview > release review response notification error', async () => {
    releaseRequestServiceMock.getReleaseBySemver.mockReturnValueOnce({ createdBy: 'Yellow' })
    const err = Error('test error')
    smtpMock.notifyReviewResponseForRelease.mockImplementationOnce(() => {
      throw err
    })
    await sendReviewResponseNotification({ kind: 'release', semver: 'Hello' } as ReviewDoc, user)

    expect(releaseRequestServiceMock.getReleaseBySemver).toBeCalled()
    expect(smtpMock.notifyReviewResponseForRelease).toBeCalled()
    expect(logMock.warn).toHaveBeenCalledWith('Error when notifying collaborators about review response.', {
      error: err,
    })
  })

  test('respondToReview > mongo update fails', async () => {
    reviewModelMock.findByIdAndUpdate.mockReturnValueOnce()

    const result: Promise<ReviewInterface> = respondToReview(
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

    expect(result).rejects.toThrowError(`Adding response to Review was not successful`)
  })

  test('respondToReview > no reviews found', async () => {
    reviewModelMock.limit.mockReturnValueOnce([])

    const result: Promise<ReviewInterface> = respondToReview(
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
    expect(reviewModelMock.findByIdAndUpdate).not.toBeCalled()
  })
})
