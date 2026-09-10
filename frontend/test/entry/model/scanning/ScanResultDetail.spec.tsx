import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import ScanResultDetail from '../../../../src/entry/model/scanning/ScanResultDetail'
import { ArtefactScanState } from '../../../../types/types'

describe('ScanResultDetail', () => {
  test('shows detailed scanner output when it is available', () => {
    render(
      <ScanResultDetail
        scanResult={
          {
            _id: 'scan-123',
            state: ArtefactScanState.Complete,
            toolName: 'ModelScan',
            scannerVersion: '0.8.1',
            summary: [],
            additionalInfo: {
              errors: [],
              issues: [{ description: 'Suspicious module', severity: 'HIGH' }],
            },
            lastRunAt: '2026-09-07T09:00:00.000Z',
            createdAt: new Date('2026-09-07T09:00:00.000Z'),
            updatedAt: new Date('2026-09-07T09:00:00.000Z'),
          } as any
        }
      />,
    )

    expect(screen.getByText('Detailed scanner output')).toBeDefined()
    expect(screen.getByText(/Suspicious module/)).toBeDefined()
  })
})
