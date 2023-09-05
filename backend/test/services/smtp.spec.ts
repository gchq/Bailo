import { describe, expect, test, vi } from 'vitest'

import { sendEmail } from '../../src/services/v2/smtp.js'

const transporterMock = vi.hoisted(() => {
  return {
    sendMail: vi.fn(() => ({ messageId: 123 })),
  }
})
vi.mock('nodemailer', async () => ({
  default: {
    createTransport: vi.fn(() => transporterMock),
  },
}))

describe('services > smtp', () => {
  test('that an email is sent', async () => {
    sendEmail('email', 'subject', 'content')

    expect(transporterMock.sendMail.mock.calls.at(0)).toMatchSnapshot()
  })
})
