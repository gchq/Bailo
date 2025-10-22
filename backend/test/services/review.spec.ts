import { describe, expect, test, vi } from 'vitest'

import AccessRequest from '../../src/models/AccessRequest.js'
import Model from '../../src/models/Model.js'
import Release from '../../src/models/Release.js'
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
import { testModelSchema, testReviewRole } from '../testUtils/testModels.js'

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

const reviewModelMock = vi.hoisted(() => {
  const obj: any = { kind: 'access', accessRequestId: 'Hello', role: 'msro' }

  obj.aggregate = vi.fn(() => obj)
  obj.find = vi.fn(() => [obj])
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
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

const reviewRoleModelMock = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => [obj])
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.limit = vi.fn(() => obj)
  obj.unwind = vi.fn(() => obj)
  obj.at = vi.fn(() => obj)
  obj.map = vi.fn(() => [])
  obj.filter = vi.fn(() => [])

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})

vi.mock('../../src/models/ReviewRole.js', async () => ({
  ...((await vi.importActual('../../src/models/ReviewRole.js')) as object),
  default: reviewRoleModelMock,
}))

const schemaModelMock = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => [obj])
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.limit = vi.fn(() => obj)
  obj.unwind = vi.fn(() => obj)
  obj.at = vi.fn(() => obj)
  obj.map = vi.fn(() => [])
  obj.filter = vi.fn(() => [])

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})

vi.mock('../../src/models/Schema.js', async () => ({
  ...((await vi.importActual('../../src/models/Schema.js')) as object),
  default: schemaModelMock,
}))

const modelModelMock = vi.hoisted(() => {
  const obj: any = { id: '123', card: {}, collaborators: [{ entity: 'user:user', roles: 'reviewer' }] }

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => [obj])
  obj.findOne = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.findByIdAndUpdate = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.limit = vi.fn(() => obj)
  obj.unwind = vi.fn(() => obj)
  obj.at = vi.fn(() => obj)
  obj.map = vi.fn(() => [])
  obj.filter = vi.fn(() => [])

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})

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

vi.mock('../../src/models/Model.js', async () => ({
  ...((await vi.importActual('../../src/models/Model.js')) as object),
  default: modelModelMock,
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

vi.mock('../../src/models/Response.js', async () => ({
  ...((await vi.importActual('../../src/models/Response.js')) as object),
  default: responseModelMock,
}))

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

describe('services > review', () => {
  const user: any = { dn: 'test' }

  test('findReviews > all reviews for user', async () => {
    await findReviews(user, true, false)

    expect(reviewModelMock.aggregate.mock.calls).toMatchSnapshot()
  })

  test('findReviews > all open reviews for user', async () => {
    const mockResponses = [{ _id: 'response' }]
    responseModelMock.find.mockResolvedValueOnce(mockResponses)
    await findReviews(user, true, true)

    expect(reviewModelMock.aggregate.mock.calls).toMatchSnapshot()
  })

  test('findReviews > active reviews for a specific model', async () => {
    await findReviews(user, false, false, 'modelId')

    expect(reviewModelMock.aggregate.mock.calls).toMatchSnapshot()
  })

  test('findReviewsForAccessRequests > success', async () => {
    await findReviewsForAccessRequests([reviewModelMock.accessRequestId])

    expect(reviewModelMock.find.mock.calls.at(0)).toMatchSnapshot()
  })

  test('createReleaseReviews > No entities found for required roles', async () => {
    schemaModelMock.findOne.mockResolvedValueOnce({ id: 'test123' })
    reviewRoleModelMock.find.mockResolvedValueOnce([])
    const result: Promise<void> = createReleaseReviews(new Model(), new Release())

    await expect(result).resolves.not.toThrowError()
    expect(smtpMock.requestReviewForRelease).not.toBeCalled()
    expect(reviewModelMock.save).not.toBeCalled()
  })

  test('createReleaseReviews > successful', async () => {
    schemaModelMock.findOne.mockResolvedValueOnce({ id: 'test123' })
    reviewRoleModelMock.find.mockResolvedValueOnce([testReviewRole])
    await createReleaseReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr', 'reviewer'] }] }),
      new Release(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForRelease).toBeCalled()
  })

  test('createAccessRequestReviews > successful', async () => {
    schemaModelMock.findOne.mockResolvedValueOnce({ id: 'test123' })
    reviewRoleModelMock.find.mockResolvedValueOnce([testReviewRole])

    await createAccessRequestReviews(
      new Model({ collaborators: [{ entity: 'user:user', roles: ['msro', 'mtr'] }] }),
      new AccessRequest(),
    )

    expect(reviewModelMock.save).toBeCalled()
    expect(smtpMock.requestReviewForAccessRequest).toBeCalled()
  })

  test('removeAccessRequestReviews > successful', async () => {
    await removeAccessRequestReviews(reviewModelMock.accessRequestId)

    expect(reviewModelMock.find.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewModelMock.delete).toBeCalled()
  })

  test('removeAccessRequestReviews > could not delete failure', async () => {
    reviewModelMock.delete.mockImplementationOnce(() => {
      throw Error('Error deleting object')
    })

    await expect(() => removeAccessRequestReviews('')).rejects.toThrowError(
      /^The requested access request review could not be deleted./,
    )
  })

  test('getReviewRoles > returns array of review roles', async () => {
    reviewRoleModelMock.find.mockImplementation(() => ({
      lean: vi.fn(),
    }))
    await findReviewRoles()

    expect(reviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewRoleModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('getReviewRoles > returns array of review roles when given a single schema Id', async () => {
    reviewRoleModelMock.find.mockImplementationOnce(() => ({
      lean: vi.fn(),
    }))
    schemaModelMock.find.mockResolvedValue([testModelSchema])
    reviewRoleModelMock.find.mockResolvedValueOnce([testReviewRole])
    await findReviewRoles('test123')

    expect(reviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewRoleModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('createReviewRole > successful', async () => {
    await createReviewRole(user, {
      name: 'reviewer',
      shortName: 'reviewer',
      kind: RoleKind.REVIEW,
    })

    expect(reviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(reviewRoleModelMock.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('addDefaultReviewRoles > successfully added default review roles', async () => {
    reviewRoleModelMock.findOne.mockResolvedValue(undefined)
    await addDefaultReviewRoles()
    expect(reviewRoleModelMock.save).toBeCalled()
  })

  test('removeReviewRole > successful', async () => {
    reviewRoleModelMock.findOne.mockResolvedValue({ ...testReviewRole, delete: vi.fn() })
    schemaModelMock.find.mockResolvedValue([{ ...testModelSchema, save: vi.fn() }])
    modelModelMock.find.mockResolvedValue([
      { id: 'test-1234', collaborators: [{ entity: 'user:user', roles: ['reviewer'] }], save: vi.fn() },
    ])
    await removeReviewRole({} as any, 'reviewer')

    expect(reviewRoleModelMock.match.mock.calls.at(0)).toMatchSnapshot()
    expect(schemaModelMock.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('updateReviewRole > successful', async () => {
    const shortName = 'reviewer'

    await updateReviewRole(user, shortName, {
      name: 'reviewer',
      description: 'existing description',
      systemRole: 'owner',
      defaultEntities: ['user:user2'],
    })

    expect(reviewRoleModelMock.save).toBeCalled()
  })

  test('updateReviewRole > failure', async () => {
    //make sure find works
    const shortName = 'badShortName'
    reviewRoleModelMock.findOne.mockImplementation(() => {
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
