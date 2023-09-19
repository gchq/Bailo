import { describe, expect, test, vi } from 'vitest'

import Model from '../../src/models/v2/Model.js'
import Release from '../../src/models/v2/Release.js'
import { countReviews, createReleaseReviews, findReviewsByActive } from '../../src/services/v2/review.js'

vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const ReviewModel = vi.hoisted(() => {
  const save = vi.fn()
  const model: any = vi.fn(() => ({
    save,
  }))

  model.save = save

  model.aggregate = vi.fn(() => model)
  model.match = vi.fn(() => model)
  model.sort = vi.fn(() => model)
  model.lookup = vi.fn(() => model)
  model.unwind = vi.fn(() => model)

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

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../src/services/v2/log.js', async () => ({
  default: logMock,
}))

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviewsByActive > active', async () => {
    await findReviewsByActive(user, true)

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviewsByActive > not active', async () => {
    await findReviewsByActive(user, false)

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviewsByActive > active reviews for a specific model', async () => {
    await findReviewsByActive(user, true, 'modelId')

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviewsByActive > inactive reviews for a specific model', async () => {
    await findReviewsByActive(user, false, 'modelId')

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('countReviews > successful', async () => {
    await countReviews(user)

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('createReleaseReviews > No entities found for required roles', async () => {
    const result: Promise<void> = createReleaseReviews(new Model(), new Release())
    expect(result).rejects.toThrowError(`Could not find any entities for the role`)
    expect(ReviewModel.save).not.toBeCalled()
  })

  test('createReleaseReviews > successful', async () => {
    await createReleaseReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new Release(),
    )
    expect(ReviewModel.save).toBeCalled()
    expect(smtpMock.requestReviewForRelease).toBeCalled()
  })
})
