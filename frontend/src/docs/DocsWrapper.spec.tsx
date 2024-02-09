import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { describe, expect, it } from 'vitest'

import { lightTheme } from '../theme'
import DocsWrapper from './DocsWrapper'

describe('DocsWrapper', () => {
  it('renders a DocsWrapper component', async () => {
    mockRouter.push('/docs')

    render(
      <ThemeProvider theme={lightTheme}>
        <DocsWrapper />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Documentation')).toBeDefined()
    })
  })
})
