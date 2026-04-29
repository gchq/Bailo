import { describe, expect, test, vi } from 'vitest'

import { buildEmail } from '../../../src/services/smtp/emailBuilder.js'

const logMock = vi.hoisted(() => ({
  error: vi.fn(),
}))
vi.mock('../../../src/services/log.js', async () => ({
  default: logMock,
}))

describe('services > smtp > emailBuilder', () => {
  test('buildEmail > success', async () => {
    const title = 'Your model has done something'
    const emailContent = await buildEmail(title, [], [], true)

    expect(emailContent?.html).toContain(title)
    expect(emailContent?.subject).toContain(title)
  })

  test('buildEmail > XSS > fail', async () => {
    const badString = '<script> alert("This is a bad model"); </script>'
    const emailContent = await buildEmail(badString, [], [], true)

    expect(emailContent).toBeUndefined()
    expect(logMock.error).toHaveBeenCalledExactlyOnceWith(
      { actions: [], metadata: [], title: badString },
      'Email failed sanitisation. Not forwarding request',
    )
  })
})
