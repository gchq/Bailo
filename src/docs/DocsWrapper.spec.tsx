/**
 * @jest-environment jsdom
 */

import { ThemeProvider } from '@mui/system'
import { render, screen, waitFor } from '@testing-library/react'
import { mockNextUseRouter } from '../../utils/testUtils'
import { lightTheme } from '../theme'
import DocsWrapper from './DocsWrapper'

describe('DocsWrapper', () => {
  it('renders a DocsWrapper component', async () => {
    mockNextUseRouter({ pathname: '/docs' })

    render(
      <ThemeProvider theme={lightTheme}>
        <DocsWrapper />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Documentation')).toBeDefined()
    })
  })
})
