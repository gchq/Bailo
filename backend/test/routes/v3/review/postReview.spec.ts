import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postReviewSchema } from '../../../../src/routes/v3/review/postReview.js'
import { ReviewKind } from '../../../../src/types/enums.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'
import { testReviewResponse } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockReviewService = vi.hoisted(() => {
  return {
    createReview: vi.fn(() => testReviewResponse),
    isLifecycleReviewDateValid: vi.fn(() => true),
  }
})
vi.mock('../../../../src/services/v3/review.js', () => mockReviewService)

const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z')

describe('routes > review > postReview', () => {
  beforeEach(() => {
    vi.setSystemTime(FIXED_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('successfully create a lifecycle review', async () => {
    const fixture = createFixture(postReviewSchema)
    const res = await testPost(`/api/v3/review/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postReviewSchema)
    const res = await testPost(`/api/v3/review/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateReview).toHaveBeenCalled()
    expect(audit.onCreateReview.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('rejects date when isLifecycleReviewDateValid returns false', async () => {
    mockReviewService.isLifecycleReviewDateValid.mockReturnValueOnce(false)
    const fixture = createFixture(postReviewSchema)
    fixture.body = { kind: ReviewKind.Lifecycle, dueDate: new Date('2027-01-01T12:00:00.000Z') }
    const res = await testPost(`/api/v3/review/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(400)
    expect(res.body.error.message).toMatch(/cannot be further than/)
  })

  test('rejects date before year 2000', async () => {
    const fixture = createFixture(postReviewSchema)
    fixture.body = { kind: ReviewKind.Lifecycle, dueDate: new Date('1999-12-31T00:00:00.000Z') }
    const res = await testPost(`/api/v3/review/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(400)
    expect(res.body.error.message).toMatch(/before year 2000/)
  })
})
