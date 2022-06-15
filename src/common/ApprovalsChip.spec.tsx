/**
 * @jest-environment jsdom
 */

import ApprovalsChip from './ApprovalsChip'
import { render, screen, waitFor } from '@testing-library/react'
import theme from '../theme'
import ThemeProvider from '@mui/system/ThemeProvider'

describe('ApprovalsChip', () => {
  it('renders an ApprovalsChip component with 0/2 approvals', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ApprovalsChip approvals={['No Response', 'No Response']} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 0/2')).not.toBeUndefined()
    })
  })

  it('renders an ApprovalsChip component with 1/2 approvals', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ApprovalsChip approvals={['Accepted', 'No Response']} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 1/2')).not.toBeUndefined()
    })
  })

  it('renders an ApprovalsChip component with 2/2 approvals', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ApprovalsChip approvals={['Accepted', 'Accepted']} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 2/2')).not.toBeUndefined()
    })
  })

  it('renders an ApprovalsChip component with 0/1 approvals', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ApprovalsChip approvals={['No Response']} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 0/1')).not.toBeUndefined()
    })
  })

  it('renders an ApprovalsChip component with 1/1 approvals', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ApprovalsChip approvals={['Accepted']} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Approvals 1/1')).not.toBeUndefined()
    })
  })
})
