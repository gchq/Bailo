import { describe, expect, test, vi } from 'vitest'

import AccessRequest from '../../../src/models/AccessRequest.js'
import Release from '../../../src/models/Release.js'
import Review from '../../../src/models/Review.js'
import {
  notifyReviewResponseForAccess,
  notifyReviewResponseForRelease,
  requestReviewForAccessRequest,
  requestReviewForRelease,
} from '../../../src/services/smtp/smtp.js'
import config from '../../../src/utils/config.js'

vi.mock('../../../src/utils/v2/config.js', () => {
  return {
    __esModule: true,
    default: {
      app: {
        protocol: '',
        host: '',
        port: 3000,
      },

      smtp: {
        enabled: true,

        connection: {
          host: 'localhost',
          port: 1025,
          secure: false,
          auth: undefined,
          tls: {
            rejectUnauthorized: false,
          },
        },

        from: '"Bailo 📝" <bailo@example.org>',
      },
    },
  }
})

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../../src/services/v2/log.js', async () => ({
  default: logMock,
}))

const transporterMock = vi.hoisted(() => {
  return {
    sendMail: vi.fn(() => ({ messageId: 123 })),
  }
})
const nodemailerMock = vi.hoisted(() => ({
  createTransport: vi.fn(() => transporterMock),
}))
vi.mock('nodemailer', async () => ({
  default: nodemailerMock,
}))

const authenticationMock = vi.hoisted(() => ({
  getUserInformationList: vi.fn(() => [Promise.resolve({ email: 'email@email.com' })]),
  getUserInformation: vi.fn(() => [Promise.resolve({ name: 'Joe Blogs' })]),
}))
vi.mock('../../../src/connectors/authentication/index.js', async () => ({ default: authenticationMock }))

const emailBuilderMock = vi.hoisted(() => ({
  buildEmail: vi.fn(() => ({ subject: 'subject', text: 'text', html: 'html' })),
}))
vi.mock('../../../src/services/v2/smtp/emailBuilder.js', async () => emailBuilderMock)

describe('services > smtp > smtp', () => {
  const review = new Review({ role: 'owner', responses: [{ decision: 'approve' }] })
  const release = new Release({ modelId: 'testmodel-123', semver: '1.2.3', createdBy: 'user:user' })
  const access = new AccessRequest({ metadata: { overview: { entities: ['user:user'] } } })

  test('that a Release Review email is not sent when disabled in config', async () => {
    vi.spyOn(config, 'smtp', 'get').mockReturnValue({
      enabled: false,
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
    })

    await requestReviewForRelease('user:user', review, release)

    expect(transporterMock.sendMail).not.toBeCalled()
  })

  test('that an Access Request Review email is not sent when disabled in config', async () => {
    vi.spyOn(config, 'smtp', 'get').mockReturnValue({
      enabled: false,
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
    })

    await requestReviewForAccessRequest('user:user', review, access)

    expect(transporterMock.sendMail).not.toBeCalled()
  })

  test('that an email is not sent after a response for a release review if disabled in config', async () => {
    vi.spyOn(config, 'smtp', 'get').mockReturnValue({
      enabled: false,
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
    })
    await notifyReviewResponseForRelease(review, release)

    expect(transporterMock.sendMail).not.toBeCalled()
  })

  test('that an email is not sent after a response for a an access request review if disabled in config', async () => {
    vi.spyOn(config, 'smtp', 'get').mockReturnValue({
      enabled: false,
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
    })
    await notifyReviewResponseForAccess(review, access)

    expect(transporterMock.sendMail).not.toBeCalled()
  })

  test('that an email is sent for Release Reviews', async () => {
    await requestReviewForRelease('user:user', review, release)

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent for Access Request Reviews', async () => {
    await requestReviewForAccessRequest('user:user', review, access)
    authenticationMock.getUserInformation.mockReturnValueOnce([Promise.resolve({ name: 'Joe Blogs' })])

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is sent after a response for a release review', async () => {
    await notifyReviewResponseForRelease(review, release)

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is not sent if a response for a release review cannot be found', async () => {
    await notifyReviewResponseForRelease(new Review({ role: 'owner', responses: [] }), release)

    expect(transporterMock.sendMail).not.toBeCalled()
  })

  test('that an email is sent after a response for a an access request review', async () => {
    await notifyReviewResponseForAccess(review, access)

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is not sent if a response for an access request review cannot be found', async () => {
    await notifyReviewResponseForAccess(new Review({ role: 'owner', responses: [] }), access)

    expect(transporterMock.sendMail).not.toBeCalled()
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

    await requestReviewForRelease('group:group1', new Review({ role: 'owner' }), new Release())

    expect(transporterMock.sendMail.mock.calls.length).toBe(20)
  })

  test('that we log when an email cannot be sent', async () => {
    authenticationMock.getUserInformationList.mockReturnValueOnce([
      Promise.resolve({ email: 'member1@email.com' }),
      Promise.resolve({ email: 'member2@email.com' }),
    ])
    transporterMock.sendMail.mockRejectedValueOnce('Failed to send email')

    const result: Promise<void> = requestReviewForRelease('user:user', review, release)
    expect(result).rejects.toThrowError(`Unable to send email`)
  })
})
