import { describe, expect, test, vi } from 'vitest'

import { getModelTransferSchema } from '../../../src/routes/v2/modelTransfer/getModelTransfer.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

const mockModelTransferService = vi.hoisted(() => ({
  default: {
    findModelTransferById: vi.fn(async () => ({
      _id: '699ed901eaa620f4a39631d7',
      modelId: '822ed901eaa620f4a39631d8',
      status: 'in_progress',
      createdBy: 'bob',
      deleted: false,
      deletedBy: '',
      deletedAt: '',
      createdAt: '2026-02-25T11:12:01.972Z',
      updatedAt: '2026-02-25T11:12:01.972Z',
    })),
  },
}))

vi.mock('../../../src/services/modelTransfer.js', () => mockModelTransferService)

describe('routes > model > getModelTransfer', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getModelTransferSchema)

    const res = await testGet(`/api/v2/transfer/${fixture.params.transferId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
