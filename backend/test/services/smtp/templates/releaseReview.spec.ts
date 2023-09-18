import { describe, expect, test, vi } from 'vitest'

import { ReleaseReviewEmail } from '../../../../src/services/v2/smtp/templates/releaseReview.js'

const mockDedent = vi.hoisted(() => {
  const model: any = vi.fn()

  return model
})
vi.mock('dedent-js', async () => ({
  default: mockDedent,
}))

const mockMjml = vi.hoisted(() => {
  const model: any = vi.fn(() => ({
    html: 'html',
  }))

  return model
})
vi.mock('mjml', async () => ({
  default: mockMjml,
}))
//import mjml2html from 'mjml'

describe('services > smtp > templates > releaseReview', () => {
  test('that the subject is set', async () => {
    const testEmail = new ReleaseReviewEmail()
    testEmail.setSubject('resource', 'role')
    expect(mockDedent.mock.calls).toMatchSnapshot()
  })

  test('that the html is set', async () => {
    const testEmail = new ReleaseReviewEmail()
    testEmail.setHtml('releaseName', 'modelId', '/base/url', 'author')
    expect(mockDedent.mock.calls).toMatchSnapshot()
  })

  test('that the text is set', async () => {
    const testEmail = new ReleaseReviewEmail()
    testEmail.setText('releaseName', 'modelId', '/base/url', 'author')
    expect(mockDedent.mock.calls).toMatchSnapshot()
  })

  test('that the html is set', async () => {
    const testEmail = new ReleaseReviewEmail()
    testEmail.setHtml('releaseName', 'modelId', '/base/url', 'author')
    expect(mockDedent.mock.calls).toMatchSnapshot()
  })

  test('that the to field is set', async () => {
    const testEmail = new ReleaseReviewEmail()
    testEmail.setTo('email@address')
    expect(testEmail.to).toBe('email@address')
  })
})
