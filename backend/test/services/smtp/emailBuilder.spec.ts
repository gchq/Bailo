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

  test('buildEmail > text content', async () => {
    const emailContent = await buildEmail(
      'Title',
      [
        { title: 'Model', data: 'name' },
        { title: 'Version', data: '1.0.0' },
      ],
      [{ name: 'Open', url: 'https://example.com' }],
    )

    expect(emailContent.text).toEqual("Title\n\nModel: 'name'\nVersion: '1.0.0'\n\n\nOpen: 'https://example.com'\n")
  })
})
