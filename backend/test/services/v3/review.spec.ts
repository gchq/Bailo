import { describe, expect, test, vi } from 'vitest'

import {
  createReview,
  findReviewById,
  isLifecycleReviewDateValid,
  notifyReviewer,
} from '../../../src/services/v3/review.js'
import { ReviewKind } from '../../../src/types/enums.js'
import { getTypedModelMock } from '../../testUtils/setupMongooseModelMocks.js'

const ReviewModel = getTypedModelMock('ReviewModel')

vi.mock('../../../src/connectors/authentication/index.js', () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const authMocks = vi.hoisted(() => ({
  default: {
    models: vi.fn(),
    model: vi.fn(),
  },
}))
vi.mock('../../../src/connectors/authorisation/index.js', () => authMocks)

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
  getModelSystemRoles: vi.fn(),
  getModelByIdNoAuth: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => modelMock)

const mockSchedulerService = vi.hoisted(() => ({
  scheduleLifeCycleReviewEmails: vi.fn(),
}))
vi.mock('../../../src/services/schedule/scheduler.js', () => mockSchedulerService)

const smtpMock = vi.hoisted(() => ({
  notifyReviewRoleOfAdditionalReview: vi.fn(),
}))
vi.mock('../../../src/services/smtp/smtp.js', () => smtpMock)

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviewById > can find a review using a given reviewId', async () => {
    modelMock.getModelById.mockResolvedValueOnce([
      {
        id: 'test-1234',
        collaborators: [{ entity: 'user:user', roles: ['owner'] }],
        save: vi.fn(),
      },
    ])
    ReviewModel.at.mockResolvedValue({
      modelId: 'test-1234',
      role: 'owner',
    })
    const review = await findReviewById(user, '6a058a8a125dba342f0034a4')
    expect(review).toMatchSnapshot()
  })

  test('createReview > create lifecycle review', async () => {
    modelMock.getModelById.mockResolvedValueOnce({
      id: 'test-1234',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
      save: vi.fn(),
    })
    modelMock.getModelSystemRoles.mockReturnValue(['owner'])
    ReviewModel.aggregate.mockResolvedValue([])
    ReviewModel.findOne.mockResolvedValueOnce(undefined)
    authMocks.default.models.mockResolvedValueOnce([{ success: true } as any])
    authMocks.default.model.mockResolvedValueOnce({ success: true } as any)
    const dueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    const newReview = await createReview({} as any, 'test-1234', {
      kind: ReviewKind.Lifecycle,
      dueDate,
    })
    expect(newReview).toBeDefined()
    expect(newReview.kind).toBe(ReviewKind.Lifecycle)
    expect(newReview.modelId).toBe('test-1234')
  })

  test('createReview > schedules lifecycle review emails after creating a lifecycle review', async () => {
    const dueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    modelMock.getModelById.mockResolvedValueOnce({
      id: 'test-1234',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
      save: vi.fn(),
    })
    modelMock.getModelSystemRoles.mockReturnValue(['owner'])
    ReviewModel.aggregate.mockResolvedValue([])
    ReviewModel.findOne.mockResolvedValueOnce(undefined)
    authMocks.default.models.mockResolvedValueOnce([{ success: true } as any])
    authMocks.default.model.mockResolvedValueOnce({ success: true } as any)

    await createReview({} as any, 'test-1234', {
      kind: ReviewKind.Lifecycle,
      dueDate,
    })

    expect(mockSchedulerService.scheduleLifeCycleReviewEmails).toHaveBeenCalledWith(
      'test-1234',
      expect.any(String),
      dueDate,
    )
  })

  test('isLifecycleReviewDateValid > returns true for date within max interval', () => {
    const validDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    expect(isLifecycleReviewDateValid(validDate)).toBe(true)
  })

  test('isLifecycleReviewDateValid > returns false for date beyond max interval', () => {
    const twoYearsFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2)
    expect(isLifecycleReviewDateValid(twoYearsFromNow)).toBe(false)
  })

  test('isLifecycleReviewDateValid > returns true for date exactly at max interval boundary', () => {
    const oneYearFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    expect(isLifecycleReviewDateValid(oneYearFromNow)).toBe(true)
  })

  test('isLifecycleReviewDateValid > returns true for date in the past', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24)
    expect(isLifecycleReviewDateValid(pastDate)).toBe(true)
  })

  test('createReview > cannot create lifecycle review if existing review is open', async () => {
    modelMock.getModelById.mockResolvedValueOnce({
      id: 'test-1234',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
      save: vi.fn(),
    })
    modelMock.getModelSystemRoles.mockReturnValue(['owner'])
    ReviewModel.aggregate.mockResolvedValue([
      {
        modelId: 'test-1234',
        role: 'owner',
      },
    ])
    ReviewModel.findOne.mockResolvedValueOnce({
      modelId: 'test-1234',
      role: 'owner',
      delete: vi.fn(),
    })
    authMocks.default.models.mockResolvedValueOnce([{ success: true } as any])
    authMocks.default.model.mockResolvedValueOnce({ success: true } as any)

    await expect(() =>
      createReview({} as any, 'test-1234', {
        kind: ReviewKind.Lifecycle,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      }),
    ).rejects.toThrow(/^This model has an open lifecycle review./)
  })
})

test('notifyReviewer > successfully notifies a review role', async () => {
  modelMock.getModelByIdNoAuth.mockResolvedValueOnce({ id: 'model-123' })
  modelMock.getModelById.mockResolvedValueOnce({ id: 'model-123' })
  authMocks.default.model.mockResolvedValueOnce({ success: true } as any)
  ReviewModel.limit.mockResolvedValue([
    {
      modelId: 'model-123',
      role: 'owner',
      kind: ReviewKind.Release,
    },
  ])
  smtpMock.notifyReviewRoleOfAdditionalReview.mockResolvedValueOnce(() => Promise.resolve())
  await notifyReviewer({} as any, '6a2c20a481e52c790216eaaa')
})
