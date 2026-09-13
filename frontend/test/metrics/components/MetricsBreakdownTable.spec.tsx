import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { UserDisplayProps } from 'src/common/UserDisplay'
import { MetricsBreakdownTable } from 'src/metrics/components/MetricsBreakdownTable'
import { lightTheme } from 'src/theme'
import { ModelBreakdown } from 'types/types'
import { describe, expect, test, vi } from 'vitest'

vi.mock('src/common/UserDisplay.tsx', () => ({ default: (_props: UserDisplayProps) => <></> }))

const headers = ['Entry ID', 'Name', 'Kind', 'Owner', 'Access requests']
const data: ModelBreakdown[] = [
  {
    entryId: 'model-1',
    entryName: 'Model One',
    entryKind: 'model',
    modelOwners: ['user:test'],
    accessRequestCount: 3,
  },
]

describe('MetricsBreakdownTable', () => {
  test('displays the access request count for each entry', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <MetricsBreakdownTable headers={headers} data={data} />
      </ThemeProvider>,
    )

    expect(screen.getByText('Access requests')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
  })
})
