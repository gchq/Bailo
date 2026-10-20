import { describe, expect, test, vi } from 'vitest'

import { ReviewInterface } from '../../../src/models/Review.js'
import { UserInterface } from '../../../src/models/User.js'
import {
  notifyCreatorOfDeploymentAssessmentApproval,
  notifyLifeCycleReview,
  notifyModelOwnersOfDeploymentApproval,
  notifyReleaseOnApproval,
  notifyReviewResponseForAccess,
  notifyReviewResponseForDeploymentAssessment,
  notifyReviewResponseForRelease,
  notifyReviewRoleOfAdditionalReview,
  notifyRiskOwnerOfDeploymentAssessment,
  notifyRiskOwnersOfDeploymentAssessmentApprovalRevoked,
  requestReviewForAccessRequest,
  requestReviewForRelease,
  startImportNotification,
  transferCompleteNotification,
} from '../../../src/services/smtp/smtp.js'
import { fromEntity } from '../../../src/utils/entity.js'
import { setTestConfig } from '../../testUtils/setupTestConfig.js'
import {
  testDeploymentAssessment,
  testModel,
  testRelease,
  testReleaseReview,
  testReviewResponse,
} from '../../testUtils/testModels.js'

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../../src/services/log.js', async () => ({
  default: logMock,
}))

const reviewMock = vi.hoisted(() => ({
  getRoleEntities: vi.fn(() => ({ owner: ['user:user'] })),
}))
vi.mock('../../../src/services/review.js', async () => reviewMock)

const transporterMock = vi.hoisted(() => {
  return {
    sendMail: vi.fn(function () {
      return {
        messageId: 123,
      }
    }),
  }
})
const nodemailerMock = vi.hoisted(() => ({
  createTransport: vi.fn(function () {
    return transporterMock
  }),
}))
vi.mock('nodemailer', async () => ({
  default: nodemailerMock,
}))

const authenticationMock = vi.hoisted(() => ({
  getUserInformationList: vi.fn(function () {
    return [Promise.resolve({ email: 'email@email.com' })]
  }),
  getUserInformation: vi.fn(function (entity: string = 'user:user') {
    const { value } = fromEntity(entity)
    return Promise.resolve({
      email: `${value}@example.com`,
      name: 'Joe Bloggs',
      organisation: 'Acme Corp',
    })
  }),
}))
vi.mock('../../../src/connectors/authentication/index.js', async () => ({ default: authenticationMock }))

const emailBuilderMock = vi.hoisted(() => ({
  buildEmail: vi.fn(function () {
    return {
      subject: 'subject',
      text: 'text',
      html: 'html',
    }
  }),
}))
vi.mock('../../../src/services/smtp/emailBuilder.js', async () => emailBuilderMock)

const responseService = vi.hoisted(() => ({
  findResponseById: vi.fn(function () {
    return {
      user: 'user:user',
      comment: 'This is a comment',
      decision: 'approve',
      kind: 'review',
    }
  }),
  checkAccessRequestsApproved: vi.fn(() => true),
}))
vi.mock('../../../src/services/response.js', async () => responseService)

const AccessRequestModelMock = vi.hoisted(() => ({
  find: vi.fn(() => [] as any[]),
}))
vi.mock('../../../src/models/AccessRequest.js', () => ({ default: AccessRequestModelMock }))

const getModelByIdMock = vi.hoisted(() =>
  vi.fn(function () {
    return {
      id: 'modelId',
      collaborators: [
        {
          entity: 'user:user',
          roles: ['owner'],
        },
        {
          entity: 'user:user2',
          roles: ['owner'],
        },
      ],
    }
  }),
)

vi.mock('../../../src/services/model.js', () => ({
  getModelByIdNoAuth: getModelByIdMock,
  getRoleEntities: vi.fn((roles, _collaborators) => ({ [roles[0]]: ['user:user'] })),
}))

const releaseService = vi.hoisted(() => ({
  getReleaseBySemver: vi.fn(() => testRelease),
  semverStringToObject: vi.fn(() => {}),
}))
vi.mock('../../../src/services/release.js', async () => releaseService)

describe('services > smtp > smtp', () => {
  const review = {
    role: 'owner',
    responses: [{ decision: 'approve' }],
  } as any
  const release = {
    modelId: 'testmodel-123',
    semver: '1.2.3',
    createdBy: 'user:user',
  } as any
  const access = {
    metadata: { overview: { entities: ['user:user'] } },
  } as any

  test('that a Release Review email is not sent when disabled in config', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await requestReviewForRelease(['user:user'], review, release)

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an Access Request Review email is not sent when disabled in config', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await requestReviewForAccessRequest(['user:user'], review, access)

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an email is not sent after a response for a release review if disabled in config', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await notifyReviewResponseForRelease(testReviewResponse as any, release)

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an email is not sent after a response for a an access request review if disabled in config', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await notifyReviewResponseForAccess(testReviewResponse as any, access)

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an email is not sent to a DRO after a deployment assessment is created if disabled in config', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await notifyRiskOwnerOfDeploymentAssessment('user:test', testDeploymentAssessment, 'user:user')

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an email is sent for Release Reviews', async () => {
    await requestReviewForRelease(['user:user'], review, release)

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent for Access Request Reviews', async () => {
    await requestReviewForAccessRequest(['user:user'], review, access)

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent after a response for a release review', async () => {
    await notifyReviewResponseForRelease(testReviewResponse as any, release)

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent after a response for a an access request review', async () => {
    await notifyReviewResponseForAccess(testReviewResponse as any, access)

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent after an import has begun', async () => {
    await startImportNotification('modelId')

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent after an import has complete', async () => {
    await transferCompleteNotification('modelId', false, {
      'Successful Files': ['fileabc'],
      'Successful Images': ['alpine:latest'],
    })

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent after an import has failed', async () => {
    await transferCompleteNotification('modelId', true, {
      'Failed Images': ['alpine:old'],
      'Successful Files': ['fileabc'],
      'Successful Images': ['alpine:latest'],
    })

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that sendEmail is called for each member of a group entity', async () => {
    authenticationMock.getUserInformationList.mockReturnValueOnce([
      Promise.resolve({ email: 'member1@email.com' }),
      Promise.resolve({ email: 'member2@email.com' }),
    ])

    await requestReviewForRelease(['group:group1'], review, release)

    expect(transporterMock.sendMail.mock.calls).toMatchSnapshot()
  })

  test('that we log when an email cannot be sent', async () => {
    authenticationMock.getUserInformationList.mockReturnValueOnce([
      Promise.resolve({ email: 'member1@email.com' }),
      Promise.resolve({ email: 'member2@email.com' }),
    ])
    transporterMock.sendMail.mockRejectedValueOnce('Failed to send email')

    const result: Promise<void> = requestReviewForRelease(['user:user'], review, release)
    await expect(result).rejects.toThrow(`Unable to send email`)
  })

  test('that a lifecycle review email is not sent when smtp is disabled', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await notifyLifeCycleReview('modelId', 'review-1', '1 hour')
    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that a lifecycle review email includes a due-in message when dueIn is provided', async () => {
    getModelByIdMock.mockReturnValue({
      id: 'modelId',
      name: 'Test Model',
      kind: 'model',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
    } as any)
    await notifyLifeCycleReview('modelId', 'review-1', '1 hour')
    expect(emailBuilderMock.buildEmail).toHaveBeenCalledWith(
      'A lifecycle review for Test Model is due in 1 hour',
      expect.anything(),
      expect.anything(),
    )
    expect(transporterMock.sendMail).toHaveBeenCalled()
  })

  test('that a lifecycle review email includes a past-due message when dueIn is not provided', async () => {
    getModelByIdMock.mockReturnValue({
      id: 'modelId',
      name: 'Test Model',
      kind: 'model',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
    } as any)
    await notifyLifeCycleReview('modelId', 'review-1')
    expect(emailBuilderMock.buildEmail).toHaveBeenCalledWith(
      "A lifecycle review for Test Model has past it's due date",
      expect.anything(),
      expect.anything(),
    )
    expect(transporterMock.sendMail).toHaveBeenCalled()
  })

  test('that an email is sent to a reviewer when a user requests an additional review', async () => {
    getModelByIdMock.mockReturnValue({
      id: 'modelId',
      name: 'Test Model',
      kind: 'model',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
    } as any)
    await notifyReviewRoleOfAdditionalReview({} as UserInterface, testReleaseReview as unknown as ReviewInterface)
    expect(transporterMock.sendMail).toHaveBeenCalled()
  })

  test('that an email is sent after a response for a release review to additional reviewers', async () => {
    await notifyReviewResponseForRelease(testReviewResponse as any, release)
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1)
  })

  test('that an email is sent to all stakeholders on release', async () => {
    getModelByIdMock.mockReturnValue(testModel)
    await notifyReleaseOnApproval('modelId', release)
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1)
  })

  test('that an email is sent to a DRO on deployment assessment creation', async () => {
    getModelByIdMock.mockReturnValue(testModel)
    await notifyRiskOwnerOfDeploymentAssessment('user:user', testDeploymentAssessment, 'user:user')
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1)
  })

  test('that an email is sent to risk owners when a DA approval is revoked', async () => {
    await notifyRiskOwnersOfDeploymentAssessmentApprovalRevoked(
      ['user:risk-owner1', 'user:risk-owner2'],
      testDeploymentAssessment,
      'Editor Name',
    )
    expect(emailBuilderMock.buildEmail).toHaveBeenCalledWith(
      'A deployment assessment you approved has been edited and needs to be reviewed again',
      expect.arrayContaining([{ title: 'Edited By', data: 'Editor Name' }]),
      expect.anything(),
      true,
    )
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1)
  })

  test('that an email is not sent to risk owners when a DA approval is revoked when smtp is disabled', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await notifyRiskOwnersOfDeploymentAssessmentApprovalRevoked(
      ['user:risk-owner'],
      testDeploymentAssessment,
      'Editor Name',
    )
    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that the deployment approval email lists every model once', async () => {
    const secondModel = { ...testModel, id: 'second-model', name: 'Second Model' }
    await notifyModelOwnersOfDeploymentApproval(
      ['user:user1'],
      testDeploymentAssessment,
      [testModel, secondModel],
      'user:user',
    )

    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1)
    const [, , actions, , list] = emailBuilderMock.buildEmail.mock.calls.at(-1) as unknown as any[]
    expect(list.items).toHaveLength(2)
    expect(actions).toHaveLength(2)
  })

  test('that the deployment approval email truncates long model lists', async () => {
    const models = Array.from({ length: 6 }, (_, index) => ({
      ...testModel,
      id: `model-${index}`,
      name: `Model ${index}`,
    }))

    await notifyModelOwnersOfDeploymentApproval(['user:user'], testDeploymentAssessment, models, 'user:user')

    const [, , , , list] = emailBuilderMock.buildEmail.mock.calls.at(-1) as unknown as any[]
    expect(list.title).toBe('Models')
    expect(list.items).toHaveLength(5)
    expect(list.items.map((item: any) => item.detail)).toEqual(['model-0', 'model-1', 'model-2', 'model-3', 'model-4'])
  })

  test('that an email is sent to the DA creator when it is reviewed by a DRO', async () => {
    await notifyReviewResponseForDeploymentAssessment(testDeploymentAssessment, 'reject', 'user:user')
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1)
  })

  test('that an email is not sent to the DA creator when it is reviewed by a DRO when smtp is disabled', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await notifyReviewResponseForDeploymentAssessment(testDeploymentAssessment, 'reject', 'user:user')
    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an email is sent to the DA creator when it is approved by a DRO', async () => {
    await notifyCreatorOfDeploymentAssessmentApproval(testDeploymentAssessment, 'user:user')
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1)
    const [title, metadata] = emailBuilderMock.buildEmail.mock.calls.at(-1) as unknown as any[]
    expect(title).toBe('A deployment assessment you own has been approved')
    expect(metadata.map((info: any) => info.title)).toEqual([
      'Deployment Assessment Name',
      'Deployment Assessment ID',
      'Approved By',
    ])
  })

  test('that an email is not sent to the DA creator when it is approved by a DRO when smtp is disabled', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await notifyCreatorOfDeploymentAssessmentApproval(testDeploymentAssessment, 'user:user')
    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test.each([
    [1, 'A deployment assessment has been approved for a model you own'],
    [3, 'A deployment assessment has been approved for 3 models you own'],
  ])(
    'that the model owner approval email title states the owner owns the model (%i models)',
    async (count, expected) => {
      const models = Array.from({ length: count }, (_, index) => ({ ...testModel, id: `model-${index}` }))

      await notifyModelOwnersOfDeploymentApproval(['user:user1'], testDeploymentAssessment, models, 'user:user')

      const [title] = emailBuilderMock.buildEmail.mock.calls.at(-1) as unknown as any[]
      expect(title).toBe(expected)
    },
  )

  test('that an email is sent to all model developers when a DRO approves a DA that contains their models', async () => {
    await notifyModelOwnersOfDeploymentApproval(
      ['user:user1', 'user:user2'],
      testDeploymentAssessment,
      [testModel],
      'user:user',
    )
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1)
  })

  test('that an email is not sent to all model developers when a DRO approves a DA that contains their models when smtp is disabled', async () => {
    setTestConfig({ smtp: { enabled: false } })
    await notifyModelOwnersOfDeploymentApproval(
      ['user:user1', 'user:user2'],
      testDeploymentAssessment,
      [testModel],
      'user:user',
    )
    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })
})
