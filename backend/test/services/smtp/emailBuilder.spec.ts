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

  test('buildEmail > list > renders every item in html and text', async () => {
    const emailContent = await buildEmail('Title', [], [], false, {
      title: 'Models',
      items: [
        { label: 'Model One', detail: 'model-one', url: 'https://example.com/model/model-one' },
        { label: 'Model Two', detail: 'model-two', url: 'https://example.com/model/model-two' },
      ],
    })

    expect(emailContent.html).toContain('Models')
    expect(emailContent.html).toContain('Model One')
    expect(emailContent.html).toContain('https://example.com/model/model-one')
    expect(emailContent.html).toContain('Model Two')
    expect(emailContent.html).toContain('https://example.com/model/model-two')
    expect(emailContent.text).toContain("- Model One (model-one): 'https://example.com/model/model-one'")
    expect(emailContent.text).toContain("- Model Two (model-two): 'https://example.com/model/model-two'")
  })

  test('buildEmail > list > items without a url or detail are still rendered', async () => {
    const emailContent = await buildEmail('Title', [], [], false, { title: 'Models', items: [{ label: 'Plain' }] })

    expect(emailContent.html).toContain('Plain')
    expect(emailContent.text).toContain('- Plain')
  })

  test('buildEmail > list > an empty list is omitted', async () => {
    const emailContent = await buildEmail('Title', [], [], false, { title: 'Models', items: [] })

    expect(emailContent.html).not.toContain('Models')
    expect(emailContent.text).not.toContain('Models')
  })

  test('buildEmail > list > no list leaves the existing output unchanged', async () => {
    const emailContent = await buildEmail(
      'Title',
      [{ title: 'Info', data: 'value' }],
      [{ name: 'Go', url: 'https://example.com' }],
    )

    expect(emailContent.text).toContain("Info: 'value'")
    expect(emailContent.text).toContain("Go: 'https://example.com'")
  })

  test('buildEmail > list > XSS > fail', async () => {
    const badString = '<script>alert("bad")</script>'
    const emailContent = await buildEmail('Title', [], [], false, {
      title: 'Models',
      items: [{ label: badString, detail: badString }],
    })

    expect(emailContent.html).not.toContain(badString)
    expect(emailContent.text).not.toContain(badString)
  })
})
