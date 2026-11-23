import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/webhook.js', () => ({
  removeWebhook: vi.fn(() => ({ id: 'new-webhook', modelId: 'test-model', name: 'new webhook' })),
}))

describe('routes > webhook > deleteWebhook', () => {
  test('200 > ok', async () => {
    const res = await testDelete(`/api/v2/model/test-model/webhook/new-webhook`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const res = await testDelete(`/api/v2/model/test-model/webhook/new-webhook`)

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteWebhook).toHaveBeenCalled()
    expect(audit.onDeleteWebhook.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
