import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { deleteFilesSchema } from '../../../../src/routes/v2/model/file/deleteFiles.js'
import { removeFiles } from '../../../../src/services/file.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/file.js', () => ({
  removeFiles: vi.fn(() => [
    { _id: 'file1', id: 'file1', modelId: 'testModel' },
    { _id: 'file2', id: 'file2', modelId: 'testModel' },
  ]),
}))

vi.mock('../../../../src/utils/transactions.js', () => ({
  useTransaction: vi.fn((actions) => Promise.all(actions.map((a: any) => a()))),
}))

describe('routes > file > deleteFiles', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(deleteFilesSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/files`, {
      body: fixture.body,
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('200 > duplicate file IDs are removed once', async () => {
    const fixture = createFixture(deleteFilesSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/files`, {
      body: { fileIds: ['file1', 'file2', 'file1'] },
    })

    expect(res.statusCode).toBe(200)
    expect(removeFiles).toHaveBeenCalledWith(
      expect.anything(),
      fixture.params.modelId,
      ['file1', 'file2'],
      false,
      false,
      undefined,
    )
  })

  test('400 > empty file ID list', async () => {
    const fixture = createFixture(deleteFilesSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/files`, {
      body: { fileIds: [] },
    })

    expect(res.statusCode).toBe(400)
    expect(removeFiles).not.toHaveBeenCalled()
  })

  test('audit > expected calls', async () => {
    const fixture = createFixture(deleteFilesSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/files`, {
      body: fixture.body,
    })

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteFile).toHaveBeenCalledTimes(2)
    expect(audit.onDeleteFile.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onDeleteFile.mock.calls.at(1)?.at(1)).toMatchSnapshot()
  })
})
