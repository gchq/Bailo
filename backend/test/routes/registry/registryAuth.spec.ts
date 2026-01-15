import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../../src/connectors/authorisation/index.js'
import { EntryKind } from '../../../src/models/Model.js'
import { checkAccess, softDeletePrefix } from '../../../src/routes/v1/registryAuth.js'

// **NOTICE: All functions tested in this file are located in routes/registryAuth.ts. It is assumed these will be moved to the services layer in the future, thus these tests should move too.**

vi.mock('../../../src/connectors/authorisation/index.js')

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => modelMocks)

describe('registryAuth', () => {
  test('checkAccess > failure > soft deleted', async () => {
    const name = `${softDeletePrefix}123`
    const auth = await checkAccess({ name } as any, { dn: 'dn' } as any)
    expect(auth).toStrictEqual({
      id: name,
      success: false,
      info: `Access name must not begin with soft delete prefix: ${softDeletePrefix}`,
    } as any)
  })

  test('checkAccess > failure > bad modelId', async () => {
    const name = 'badModelId/fakeImage'
    const modelId = name.split('/')[0]
    modelMocks.getModelById.mockRejectedValueOnce({})
    const auth = await checkAccess({ name, actions: ['push'] } as any, { dn: 'dn' } as any)
    expect(auth).toStrictEqual({ id: modelId, success: false, info: 'Bad modelId provided' })
  })

  test('checkAccess > failure > incorrect entry type', async () => {
    const name = 'modelId/fakeImage'
    const modelId = name.split('/')[0]
    modelMocks.getModelById.mockResolvedValueOnce({
      kind: EntryKind.DataCard,
    })
    const auth = await checkAccess({ name } as any, { dn: 'dn' } as any)
    expect(auth).toStrictEqual({
      id: modelId,
      success: false,
      info: `No registry use allowed on ${EntryKind.DataCard}`,
    })
  })

  test('checkAccess > success', async () => {
    const name = 'modelId/fakeImage'
    const modelId = name.split('/')[0]
    vi.mocked(authorisation.image).mockResolvedValue({ id: modelId, success: true })
    modelMocks.getModelById.mockResolvedValueOnce({
      kind: EntryKind.Model,
    })

    const auth = await checkAccess({ name } as any, { dn: 'dn' } as any)
    expect(auth).toStrictEqual({
      id: modelId,
      success: true,
    })
  })

  test('checkAccess > success > allowed bad modelId', async () => {
    const name = 'badModelId/fakeImage'
    const modelId = name.split('/')[0]
    modelMocks.getModelById.mockRejectedValueOnce({})
    const auth = await checkAccess({ name, actions: ['pull'] } as any, { dn: 'dn' } as any)
    expect(auth).toStrictEqual({
      id: modelId,
      success: true,
    })
  })
})
