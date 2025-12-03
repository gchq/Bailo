import { describe, expect, test, vi } from 'vitest'

import {
  addDefaultReviewRoles,
  createAccessRequestReviews,
  createReleaseReviews,
  createReviewRole,
  findReviewRoles,
  findReviews,
  findReviewsForAccessRequests,
  removeAccessRequestReviews,
  removeReviewRole,
  updateReviewRole,
} from '../../src/services/review.js'
import { RoleKind } from '../../src/types/types.js'
import { NotFound } from '../../src/utils/error.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'
import { testModelSchema, testReviewRole } from '../testUtils/testModels.js'

const ReviewModelMock = getTypedModelMock('ReviewModel')
const ReviewRoleModelMock = getTypedModelMock('ReviewRoleModel')
const SchemaModelMock = getTypedModelMock('SchemaModel')
const ModelModelMock = getTypedModelMock('ModelModel')
const ResponseModelMock = getTypedModelMock('ResponseModel')

vi.mock('../../src/connectors/authorisation/index.js', async () => ({
  default: {
    reviewRole: vi.fn(() => {
      return { id: '', success: true }
    }),
    models: vi.fn(() => {
      return { id: '', success: true }
    }),
  },
}))
vi.mock('../../src/connectors/authentication/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
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

const configMock = vi.hoisted(() => ({
  defaultReviewRoles: [
    {
      name: 'Reviewer',
      shortName: 'reviewer',
      kind: 'schema',
      description: 'Reviewer',
    },
  ],
  connectors: {
    fileScanners: {
      kinds: [],
    },
    audit: {
      kind: 'silly',
    },
  },
  registry: {
    connection: {
      internal: '',
    },
  },
}))

vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const dummyModel: any = { id: '123', card: {}, collaborators: [{ entity: 'user:user', roles: 'reviewer' }] }

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviews > all reviews for user', async () => {
    await findReviews(user, true, false)

    expect(ReviewModelMock.aggregate.mock.calls).toMatchSnapshot()
  })

  test('findReviews > all open reviews for user', async () => {
    const mockResponses = [{ _id: 'response' }]
    ResponseModelMock.find.mockResolvedValueOnce(mockResponses)
    await findReviews(user, true, true)

    expect(ReviewModelMock.aggregate.mock.calls).toMatchSnapshot()
  })

  test('findReviews > active reviews for a specific model', async () => {
    await findReviews(user, false, false, 'modelId')

    expect(ReviewModelMock.aggregate.mock.calls).toMatchSnapshot()
  })

  test('findReviewsForAccessRequests > success', async () => {
    await findReviewsForAccessRequests(['accessRequestId'])

    expect(ReviewModelMock.find.mock.calls.at(0)).toMatchSnapshot()
  })

  test('createReleaseReviews > No entities found for required roles', async () => {
    SchemaModelMock.findOne.mockResolvedValueOnce({ id: 'test123' })
    ReviewRoleModelMock.find.mockResolvedValueOnce([])
    const result: Promise<void> = createReleaseReviews(dummyModel, {} as any)

    await expect(result).resolves.not.toThrowError()
    expect(smtpMock.requestReviewForRelease).not.toBeCalled()
    expect(ReviewModelMock.save).not.toBeCalled()
  })

  test('createReleaseReviews > successful', async () => {
    SchemaModelMock.findOne.mockResolvedValueOnce({ id: 'test123' })
    ReviewRoleModelMock.find.mockResolvedValueOnce([testReviewRole])
    await createReleaseReviews(
      { collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr', 'reviewer'] }], card: {} } as any,
      {} as any,
    )

    expect(ReviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForRelease).toBeCalled()
  })

  test('createAccessRequestReviews > successful', async () => {
    SchemaModelMock.findOne.mockResolvedValueOnce({ id: 'test123' })
    ReviewRoleModelMock.find.mockResolvedValueOnce([testReviewRole])

    await createAccessRequestReviews(
      { collaborators: [{ entity: 'user:user', roles: ['reviewer', 'owner'] }] } as any,
      {} as any,
    )

    expect(ReviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForAccessRequest).toBeCalled()
  })

  test('removeAccessRequestReviews > successful', async () => {
    ReviewModelMock.find.mockResolvedValueOnce([{ delete: ReviewModelMock.delete }])

    await removeAccessRequestReviews('accessRequestId')

    expect(ReviewModelMock.find.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModelMock.delete).toBeCalled()
  })

  test('removeAccessRequestReviews > could not delete failure', async () => {
    ReviewModelMock.find.mockResolvedValueOnce([{ delete: ReviewModelMock.delete }])
    ReviewModelMock.delete.mockImplementationOnce(() => {
      throw Error('Error deleting object')
    })

    await expect(() => removeAccessRequestReviews('')).rejects.toThrowError(
      /^The requested access request review could not be deleted./,
    )
  })

  test('getReviewRoles > returns array of review roles', async () => {
    ReviewRoleModelMock.find.mockImplementation(() => ({
      lean: vi.fn(),
    }))
    await findReviewRoles()

    expect(ReviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRoleModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('getReviewRoles > returns array of review roles when given a single schema Id', async () => {
    ReviewRoleModelMock.find.mockImplementationOnce(() => ({
      lean: vi.fn(),
    }))
    SchemaModelMock.find.mockResolvedValue([testModelSchema])
    ReviewRoleModelMock.find.mockResolvedValueOnce([testReviewRole])
    await findReviewRoles('test123')

    expect(ReviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRoleModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('createReviewRole > successful', async () => {
    await createReviewRole(user, {
      name: 'reviewer',
      shortName: 'reviewer',
      kind: RoleKind.REVIEW,
    })

    expect(ReviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRoleModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('addDefaultReviewRoles > successfully added default review roles', async () => {
    ReviewRoleModelMock.findOne.mockResolvedValue(undefined)
    await addDefaultReviewRoles()
    expect(ReviewRoleModelMock.save).toBeCalled()
  })

  test('removeReviewRole > successful', async () => {
    ReviewRoleModelMock.findOne.mockResolvedValue({ ...testReviewRole, delete: vi.fn() })
    SchemaModelMock.find.mockResolvedValue([{ ...testModelSchema, save: vi.fn() }])
    ModelModelMock.find.mockResolvedValue([
      { id: 'test-1234', collaborators: [{ entity: 'user:user', roles: ['reviewer'] }], save: vi.fn() },
    ])
    await removeReviewRole({} as any, 'reviewer')

    expect(ReviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(SchemaModelMock.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('updateReviewRole > successful', async () => {
    const shortName = 'reviewer'

    await updateReviewRole(user, shortName, {
      name: 'reviewer',
      description: 'existing description',
      systemRole: 'owner',
      defaultEntities: ['user:user2'],
    })

    expect(ReviewRoleModelMock.save).toBeCalled()
  })

  test('updateReviewRole > failure', async () => {
    //make sure find works
    const shortName = 'badShortName'
    ReviewRoleModelMock.findOne.mockImplementation(() => {
      throw NotFound(`The requested review role was not found`, { shortName })
    })
    const res = updateReviewRole(user, shortName, {
      name: 'reviewer',
      description: 'description',
      systemRole: 'owner',
      defaultEntities: ['user:user2'],
    })

    await expect(res).rejects.toThrowError(/^The requested review role was not found/)
  })
})
