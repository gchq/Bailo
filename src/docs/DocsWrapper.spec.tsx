/**
 * @jest-environment jsdom
 */

import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { mockNextUseRouter } from '../../utils/testUtils.js'
import { lightTheme } from '../theme.js'
import DocsWrapper from './DocsWrapper.js'

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
