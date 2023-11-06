import { describe, expect, test, vi } from 'vitest'

import Model from '../../src/models/v2/Model.js'
import Release from '../../src/models/v2/Release.js'
import { Decision, ReviewInterface } from '../../src/models/v2/Review.js'
import { createReleaseReviews, findReviews, respondToReview } from '../../src/services/v2/review.js'
import { ReviewKind } from '../../src/types/v2/enums.js'

vi.mock('../../src/connectors/v2/authentication/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const ReviewModel = vi.hoisted(() => {
  const save = vi.fn()
  const findByIdAndUpdate = vi.fn(() => 'review')
  const model: any = vi.fn(() => ({
    save,
    findByIdAndUpdate,
  }))

  model.save = save
  model.findByIdAndUpdate = findByIdAndUpdate

  model.aggregate = vi.fn(() => model)
  model.match = vi.fn(() => model)
  model.sort = vi.fn(() => model)
  model.lookup = vi.fn(() => model)
  model.unwind = vi.fn(() => model)
  model.limit = vi.fn(() => [model])

  return model
})
vi.mock('../../src/models/v2/Review.js', async () => ({
  ...((await vi.importActual('../../src/models/v2/Review.js')) as object),
  default: ReviewModel,
}))

const smtpMock = vi.hoisted(() => ({
  requestReviewForRelease: vi.fn(),
}))
vi.mock('../../src/services/v2/smtp/smtp.js', async () => smtpMock)

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/v2/model.js', async () => modelMock)

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

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviewsByActive > active', async () => {
    await findReviews(user, true)

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
    expect(arrayUtilMock.asyncFilter).toBeCalled()
  })

  test('findReviewsByActive > not active', async () => {
    await findReviews(user, false)

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
    expect(arrayUtilMock.asyncFilter).toBeCalled()
  })

  test('findReviewsByActive > active reviews for a specific model', async () => {
    await findReviews(user, true, 'modelId')

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
    expect(arrayUtilMock.asyncFilter).toBeCalled()
  })

  test('findReviewsByActive > inactive reviews for a specific model', async () => {
    await findReviews(user, false, 'modelId')

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
    expect(arrayUtilMock.asyncFilter).toBeCalled()
  })

  test('createReleaseReviews > No entities found for required roles', async () => {
    const result: Promise<void> = createReleaseReviews(new Model(), new Release())

    expect(result).rejects.toThrowError(`Could not find any entities for the role`)
    expect(ReviewModel.save).not.toBeCalled()
  })

  test('createReleaseReviews > release successful', async () => {
    await createReleaseReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new Release(),
    )

    expect(ReviewModel.save).toBeCalled()
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

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
    expect(ReviewModel.findByIdAndUpdate).toBeCalled()
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

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
    expect(ReviewModel.findByIdAndUpdate).toBeCalled()
  })

  test('respondToReview > mongo update fails', async () => {
    ReviewModel.findByIdAndUpdate.mockReturnValueOnce()

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
    ReviewModel.limit.mockReturnValueOnce([])

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
    expect(ReviewModel.findByIdAndUpdate).not.toBeCalled()
  })
})
