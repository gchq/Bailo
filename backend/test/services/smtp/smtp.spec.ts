import { describe, expect, test, vi } from 'vitest'

import Release from '../../../src/models/v2/Release.js'
import Review from '../../../src/models/v2/Review.js'
import config from '../../../src/utils/v2/config.js'
import { requestReviewForRelease } from '../../../src/services/v2/smtp/smtp.js'

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

const authorisationMock = vi.hoisted(() => ({
  getUserInformationList: vi.fn(() => [Promise.resolve({ email: 'email@email.com' })]),
}))
vi.mock('../../../src/connectors/v2/authorisation/index.js', async () => ({ default: authorisationMock }))

const releaseEmailMock = vi.hoisted(() => {
  const obj: any = {
    from: '"Bailo 📝" <bailo@example.org>',
    to: 'email@email.com',
    subject: 'subject',
    text: 'text',
    html: 'html',
  }

  obj.setSubject = vi.fn()
  obj.setTo = vi.fn()
  obj.setText = vi.fn()
  obj.setHtml = vi.fn()

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../../src/services/v2/smtp/templates/releaseReview.js', () => ({
  ReleaseReviewEmail: releaseEmailMock,
}))

describe('services > smtp > smtp', () => {
  test('that an email is sent', async () => {
    await requestReviewForRelease('user:user', new Review(), new Release())

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })

  test('that an email is not sent when disabled in config', async () => {
    vi.spyOn(config, 'smtp', 'get').mockReturnValueOnce({
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

    await requestReviewForRelease('user:user', new Review(), new Release())

    expect(transporterMock.sendMail).not.toBeCalled()
  })

  test('that sendEmail is called for each member of a group entity', async () => {
    authorisationMock.getUserInformationList.mockReturnValueOnce([
      Promise.resolve({ email: 'member1@email.com' }),
      Promise.resolve({ email: 'member2@email.com' }),
    ])

    await requestReviewForRelease('group:group1', new Review(), new Release())

    expect(transporterMock.sendMail.mock.calls).toMatchSnapshot()
  })

  test('that we log when an email cannot be sent', async () => {
    authorisationMock.getUserInformationList.mockReturnValueOnce([
      Promise.resolve({ email: 'member1@email.com' }),
      Promise.resolve({ email: 'member2@email.com' }),
    ])
    transporterMock.sendMail.mockRejectedValueOnce('Failed to send email')

    const result: Promise<void> = requestReviewForRelease('user:user', new Review(), new Release())
    expect(result).rejects.toThrowError(`Unable to send email`)
  })
})
