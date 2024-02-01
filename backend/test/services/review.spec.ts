import { describe, expect, test, vi } from 'vitest'

import Model from '../../src/models/v2/Model.js'
import Release from '../../src/models/v2/Release.js'
import { Decision, ReviewDoc, ReviewInterface } from '../../src/models/v2/Review.js'
import {
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

    expect(smtpMock.requestReviewForRelease).not.toBeCalled()
    expect(result).resolves.not.toThrowError()
    expect(reviewModelMock.save).toBeCalled()
  })

  test('createReleaseReviews > release successful', async () => {
    await createReleaseReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new Release(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForRelease).toBeCalled()
  })

  test('respondToReview > successful', async () => {
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

  test('respondToReview > review notification successful', async () => {
    accessRequestServiceMock.getAccessRequestById.mockReturnValueOnce({ createdBy: 'Yellow' })
    await sendReviewResponseNotification({ kind: 'access', accessRequestId: 'Hello' } as ReviewDoc, user)

    expect(accessRequestServiceMock.getAccessRequestById).toBeCalled()
    expect(smtpMock.notifyReviewResponseForAccess).toBeCalled()
  })

  test('respondToReview > release notification successful', async () => {
    releaseRequestServiceMock.getReleaseBySemver.mockReturnValueOnce({ createdBy: 'Yellow' })
    await sendReviewResponseNotification({ kind: 'release', semver: 'Hello' } as ReviewDoc, user)

    expect(releaseRequestServiceMock.getReleaseBySemver).toBeCalled()
    expect(smtpMock.notifyReviewResponseForRelease).toBeCalled()
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
