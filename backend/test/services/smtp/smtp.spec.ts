import { describe, expect, test, vi } from 'vitest'

import { ReviewInterface } from '../../../src/models/Review.js'
import { UserInterface } from '../../../src/models/User.js'
import {
  dispatchEmailToModelRole,
  notifyLifeCycleReview,
  notifyReviewerOfAdditionalReview,
  notifyReviewResponseForAccess,
  notifyReviewResponseForRelease,
  requestReviewForAccessRequest,
  requestReviewForRelease,
  startImportNotification,
  transferCompleteNotification,
} from '../../../src/services/smtp/smtp.js'
import { fromEntity } from '../../../src/utils/entity.js'
import { testRelease, testReleaseReview, testReviewResponse } from '../../testUtils/testModels.js'

const configMock = vi.hoisted(() => ({
  app: { protocol: 'http', host: 'example.com', port: 80 },
  ui: {
    issues: {
      contactHref: 'mailto:hello@example.com?subject=Bailo%20Contact',
    },
  },
  smtp: {
    enabled: true,
    transporter: 'smtp',
    connection: {
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: { user: '', pass: '' },
      tls: {
        rejectUnauthorized: false,
      },
    },
    from: '"Bailo 📝" <bailo@example.org>',
  },
}))
vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../../src/services/log.js', async () => ({
  default: logMock,
}))

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
}))
vi.mock('../../../src/services/response.js', async () => responseService)

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
    vi.spyOn(configMock.smtp, 'enabled', 'get').mockReturnValueOnce(false)
    await requestReviewForRelease('user:user', review, release)

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an Access Request Review email is not sent when disabled in config', async () => {
    vi.spyOn(configMock.smtp, 'enabled', 'get').mockReturnValueOnce(false)
    await requestReviewForAccessRequest('user:user', review, access)

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an email is not sent after a response for a release review if disabled in config', async () => {
    vi.spyOn(configMock.smtp, 'enabled', 'get').mockReturnValueOnce(false)
    await notifyReviewResponseForRelease(testReviewResponse as any, release)

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an email is not sent after a response for a an access request review if disabled in config', async () => {
    vi.spyOn(configMock.smtp, 'enabled', 'get').mockReturnValueOnce(false)
    await notifyReviewResponseForAccess(testReviewResponse as any, access)

    expect(transporterMock.sendMail).not.toHaveBeenCalled()
  })

  test('that an email is sent for Release Reviews', async () => {
    await requestReviewForRelease('user:user', review, release)

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent for Access Request Reviews', async () => {
    await requestReviewForAccessRequest('user:user', review, access)

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

    await requestReviewForRelease('group:group1', review, release)

    expect(transporterMock.sendMail.mock.calls).toMatchSnapshot()
  })

  test('that sendEmail is called a maximum of 20 times', async () => {
    const users: Promise<{ email: string }>[] = []
    for (let i = 0; i <= 20; i += 1) {
      users[i] = Promise.resolve({ email: `member${i}@email.com` })
    }
    authenticationMock.getUserInformationList.mockReturnValueOnce(users)

    await requestReviewForRelease('group:group1', { role: 'owner' } as any, {} as any)

    expect(transporterMock.sendMail.mock.calls.length).toBe(20)
  })

  test('that email is sent to model owners', async () => {
    const emailContent = {
      subject: '',
      text: '',
      html: '',
    }

    await dispatchEmailToModelRole('modelId', 'owner', emailContent)
    expect(transporterMock.sendMail.mock.calls).toMatchSnapshot()
  })

  test('that we log when an email cannot be sent', async () => {
    authenticationMock.getUserInformationList.mockReturnValueOnce([
      Promise.resolve({ email: 'member1@email.com' }),
      Promise.resolve({ email: 'member2@email.com' }),
    ])
    transporterMock.sendMail.mockRejectedValueOnce('Failed to send email')

    const result: Promise<void> = requestReviewForRelease('user:user', review, release)
    await expect(result).rejects.toThrow(`Unable to send email`)
  })

  test('that a lifecycle review email is not sent when smtp is disabled', async () => {
    vi.spyOn(configMock.smtp, 'enabled', 'get').mockReturnValueOnce(false)
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
    await notifyReviewerOfAdditionalReview({} as UserInterface, testReleaseReview as unknown as ReviewInterface)
    expect(transporterMock.sendMail).toHaveBeenCalled()
  })

  test('that an email is sent after a response for a release review to additional reviewers', async () => {
    await notifyReviewResponseForRelease(testReviewResponse as any, release)
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(2)
  })
})
