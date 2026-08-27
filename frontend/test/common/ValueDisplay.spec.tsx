import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ValueDisplay from '../../src/common/ValueDisplay'
import { lightTheme } from '../../src/theme'

describe('ValueDisplay', () => {
  it('renders a plain text value', async () => {
    render(<ValueDisplay value='Minimal Schema v10' />)

    expect(await screen.findByText('Minimal Schema v10')).toBeDefined()
  })

  it('renders markdown when richText is set', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <ValueDisplay value='[AI Policy](https://example.com)' richText />
      </ThemeProvider>,
    )

    expect(await screen.findByRole('link', { name: 'AI Policy' })).toBeDefined()
  })

  it.each([undefined, ''])('falls back to a placeholder for value %o', async (value) => {
    render(<ValueDisplay value={value} />)

    expect(await screen.findByText('Empty')).toBeDefined()
  })

  it('uses a custom placeholder when emptyText is set', async () => {
    render(<ValueDisplay emptyText='No description' />)

    expect(await screen.findByText('No description')).toBeDefined()
  })
})
