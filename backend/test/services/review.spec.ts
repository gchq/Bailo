import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import AccessRequest from '../../src/models/AccessRequest.js'
import Model from '../../src/models/Model.js'
import Release from '../../src/models/Release.js'
import { Decision, ReviewDoc, ReviewInterface } from '../../src/models/Review.js'
import {
  checkAccessRequestsApproved,
  createAccessRequestReviews,
  createReleaseReviews,
  findReviews,
  respondToReview,
  sendReviewResponseNotification,
  updateReviewResponse,
} from '../../src/services/review.js'
import { ReviewKind } from '../../src/types/enums.js'

vi.mock('../../src/connectors/authorisation/index.js')
vi.mock('../../src/connectors/authentication/index.js', async () => ({
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
vi.mock('../../src/models/Review.js', async () => ({
  ...((await vi.importActual('../../src/models/Review.js')) as object),
  default: reviewModelMock,
}))

const smtpMock = vi.hoisted(() => ({
  notifyReviewResponseForAccess: vi.fn(() => Promise.resolve()),
  notifyReviewResponseForRelease: vi.fn(() => Promise.resolve()),
  requestReviewForRelease: vi.fn(() => Promise.resolve()),
  requestReviewForAccessRequest: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../src/services/smtp/smtp.js', async () => smtpMock)

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/model.js', async () => modelMock)

const accessRequestServiceMock = vi.hoisted(() => ({
  getAccessRequestById: vi.fn(),
}))
vi.mock('../../src/services/accessRequest.js', async () => accessRequestServiceMock)

const releaseRequestServiceMock = vi.hoisted(() => ({
  getReleaseBySemver: vi.fn(),
}))
vi.mock('../../src/services/release.js', async () => releaseRequestServiceMock)

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

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviews > all reviews for user', async () => {
    await findReviews(user, true)

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviews > active reviews for a specific model', async () => {
    await findReviews(user, false, 'modelId')

    expect(reviewModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('createReleaseReviews > No entities found for required roles', async () => {
    const result: Promise<void> = createReleaseReviews(new Model(), new Release())

    expect(smtpMock.requestReviewForRelease).not.toBeCalled()
    expect(result).resolves.not.toThrowError()
    expect(reviewModelMock.save).toBeCalled()
  })

  test('createReleaseReviews > successful', async () => {
    await createReleaseReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new Release(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForRelease).toBeCalled()
  })

  test('createAccessRequestReviews > successful', async () => {
    await createAccessRequestReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new AccessRequest(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForAccessRequest).toBeCalled()
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

  test('respondToReview > missing access request ID', async () => {
    releaseRequestServiceMock.getReleaseBySemver.mockReturnValueOnce({ createdBy: 'Yellow' })
    const err = Error('test error')
    smtpMock.notifyReviewResponseForAccess.mockImplementationOnce(() => {
      throw err
    })
    await sendReviewResponseNotification({ kind: 'access' } as ReviewDoc, user)

    expect(logMock.error).toHaveBeenCalledWith(
      'Unable to send notification for review response. Cannot find access request ID.',
      { review: { kind: 'access' } },
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

    expect(logMock.error).toHaveBeenCalledWith('Unable to send notification for review response. Cannot find semver.', {
      review: { kind: 'release' },
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

  test('checkAccessRequestsApproved > approved access request exists', async () => {
    reviewModelMock.find.mockReturnValueOnce([{ role: 'msro' }, { role: 'random' }])

    const result = await checkAccessRequestsApproved(['access-1', 'access-2'])

    expect(result).toBe(true)
    expect(reviewModelMock.find.mock.calls).toMatchSnapshot()
  })

  test('checkAccessRequestsApproved > no approved access requests with a required role', async () => {
    reviewModelMock.find.mockReturnValueOnce([{ role: 'random' }])

    const result = await checkAccessRequestsApproved(['access-1', 'access-2'])

    expect(result).toBe(false)
    expect(reviewModelMock.find.mock.calls).toMatchSnapshot()
  })

  test('updateReviewResponse > update for release review response sucessful', async () => {
    releaseRequestServiceMock.getReleaseBySemver.mockReturnValueOnce({ createdBy: 'Yellow' })
    await updateReviewResponse(
      user,
      'modelId',
      'msro',
      {
        id: 'demo1d0vka6-fwfqdm',
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )
    expect(releaseRequestServiceMock.getReleaseBySemver).toBeCalled()
    expect(reviewModelMock.findOneAndUpdate).toBeCalled()
  })

  test('updateReviewResponse > update for access request review response sucessful', async () => {
    accessRequestServiceMock.getAccessRequestById.mockReturnValueOnce({ createdBy: 'Yellow' })
    await updateReviewResponse(
      user,
      'modelId',
      'msro',
      {
        id: 'demo1d0vka6-fwfqdm',
        comment: 'Do better!',
      },
      ReviewKind.Access,
      'semver',
    )
    expect(accessRequestServiceMock.getAccessRequestById).toBeCalled()
    expect(reviewModelMock.findOneAndUpdate).toBeCalled()
  })

  test('updateReviewREsponse > bad authorisation for release review response update', async () => {
    vi.mocked(authorisation.release).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })
    modelMock.getModelById.mockResolvedValueOnce({ card: { version: 1 } })
    reviewModelMock.findOneAndUpdate.mockResolvedValue(null)
    expect(() =>
      updateReviewResponse(
        user,
        'modelId',
        'msro',
        {
          id: 'demo1d0vka6-fwfqdm',
          comment: 'Do better!',
        },
        ReviewKind.Release,
        'semver',
      ),
    ).rejects.toThrowError(/^You do not have permission/)
  })

  test('updateReviewResponse > bad authorisation for access request review response update', async () => {
    vi.mocked(authorisation.accessRequest).mockResolvedValue({
      info: 'You do not have permission',
      success: false,
      id: '',
    })
    modelMock.getModelById.mockResolvedValueOnce({ card: { version: 1 } })
    reviewModelMock.findOneAndUpdate.mockResolvedValue(null)
    expect(() =>
      updateReviewResponse(
        user,
        'modelId',
        'msro',
        {
          id: 'demo1d0vka6-fwfqdm',
          comment: 'Do better!',
        },
        ReviewKind.Access,
        'semver',
      ),
    ).rejects.toThrowError(/^You do not have permission/)
  })

  test('updateReviewResponse > mongo update fails', async () => {
    reviewModelMock.findOneAndUpdate.mockReturnValueOnce()

    const result: Promise<ReviewInterface> = updateReviewResponse(
      user,
      'modelId',
      'msro',
      {
        id: 'demo1d0vka6-fwfqdm',
        comment: 'Do better!',
      },
      ReviewKind.Release,
      'semver',
    )

    expect(result).rejects.toThrowError(`Updating response to Review, was not successful`)
  })
})
