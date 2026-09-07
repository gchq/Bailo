import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getFilesSchema } from '../../../../src/routes/v2/model/file/getFiles.js'
import { fileWithScanInterfaceSchema } from '../../../../src/services/specification.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const fileMock = vi.hoisted(() => {
  return {
    getFilesByModel: vi.fn(() => ['a', 'b'] as any),
  }
})
vi.mock('../../../../src/services/file.js', () => fileMock)

describe('routes > files > getFiles', () => {
  test('file scan response schema retains detailed scanner output', () => {
    const additionalInfo = {
      summary: {
        total_issues: 0,
        total_issues_by_severity: {},
        input_path: 'model.pkl',
        absolute_path: '/tmp/model.pkl',
        modelscan_version: '0.8.1',
        timestamp: '2026-09-07T09:00:00.000Z',
        scanned: { total_scanned: 1, scanned_files: ['model.pkl'] },
        skipped: { total_skipped: 0, skipped_files: [] },
      },
      issues: [],
      errors: [],
    }
    const result = fileWithScanInterfaceSchema.parse({
      modelId: 'model-123',
      name: 'model.pkl',
      size: 1024,
      mime: 'application/octet-stream',
      path: '/model/model-123/files/file-123',
      complete: true,
      scanResults: [
        {
          artefactKind: 'file',
          fileId: 'file-123',
          toolName: 'ModelScan',
          scannerVersion: '0.8.1',
          state: 'complete',
          additionalInfo,
          lastRunAt: '2026-09-07T09:00:00.000Z',
          _id: '67cecbffd2a0951d1693b396',
          id: '67cecbffd2a0951d1693b396',
        },
      ],
      createdAt: '2026-09-07T09:00:00.000Z',
      updatedAt: '2026-09-07T09:00:00.000Z',
    })

    expect(result.scanResults?.[0].additionalInfo).toEqual(additionalInfo)
  })

  test('200 > ok', async () => {
    const fixture = createFixture(getFilesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/files`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getFilesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/files`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewFiles).toHaveBeenCalled()
    expect(audit.onViewFiles.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onViewFiles.mock.calls.at(0)?.at(2)).toMatchSnapshot()
  })
})
