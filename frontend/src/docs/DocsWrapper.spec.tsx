import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { lightTheme } from '../theme'
import DocsWrapper from './DocsWrapper'
import { describe, it, expect } from 'vitest'

describe('DocsWrapper', () => {
  it('renders a DocsWrapper component', async () => {
    mockRouter.push('/docs')

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
