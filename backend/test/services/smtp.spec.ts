import { describe, expect, test, vi } from 'vitest'

import { sendEmail } from '../../src/services/v2/smtp.js'
import config from '../../src/utils/v2/config.js'

vi.mock('../../src/utils/v2/config.js', () => {
  return {
    __esModule: true,
    default: {
      smtp: {
        // Enable / disable all email sending
        enabled: true,

        // Connection information for an SMTP server.  Settings are passed directly to 'node-mailer', see reference for options:
        // https://nodemailer.com/smtp/#1-single-connection
        connection: {
          host: 'localhost',
          port: 1025,
          secure: false,
          auth: undefined,
          tls: {
            rejectUnauthorized: false,
          },
        },

        // Set the email address that Bailo should use, can be different from the SMTP server details.
        from: '"Bailo 📝" <bailo@example.org>',
      },
    },
  }
})

vi.mock('../../src/services/v2/log.js', async () => ({
  default: {
    info: vi.fn(),
  },
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

describe('services > smtp', () => {
  test('that an email is sent', async () => {
    await sendEmail('email', 'subject', 'content')

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

    await sendEmail('email', 'subject', 'content')

    expect(transporterMock.sendMail).not.toBeCalled()
  })

  test('that an error is thrown when an email cannot be sent', async () => {
    transporterMock.sendMail.mockRejectedValueOnce('Failed to send email')

    const result: Promise<void> = sendEmail('email', 'subject', 'content')
    expect(result).rejects.toThrowError(`Error Sending email notification`)
  })
})
