import { describe, expect, test } from 'vitest'

import { buildEmail } from '../../../src/services/smtp/emailBuilder.js'

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

    expect(emailContent.html).not.toContain(badString)
  })
})
