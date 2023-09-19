import { describe, expect, test, vi } from 'vitest'

import { ReleaseReviewEmail } from '../../../../src/services/v2/smtp/templates/releaseReview.js'

vi.mock('../../../../src/utils/v2/config.js', () => {
  return {
    __esModule: true,
    default: {
      smtp: {
        from: '"Bailo 📝" <bailo@example.org>',
      },
    },
  }
})

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
