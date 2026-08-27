import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import LabelledValue from '../../src/common/LabelledValue'
import { lightTheme } from '../../src/theme'

describe('LabelledValue', () => {
  it('renders the label alongside its value', async () => {
    render(<LabelledValue label='Name' value='Minimal Schema v10' />)

    expect(await screen.findByText('Name')).toBeDefined()
    expect(await screen.findByText('Minimal Schema v10')).toBeDefined()
  })

  it('renders markdown when richText is set', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <LabelledValue label='Description' value='[AI Policy](https://example.com)' richText />
      </ThemeProvider>,
    )

    expect(await screen.findByRole('link', { name: 'AI Policy' })).toBeDefined()
  })

  it.each([undefined, ''])('falls back to a placeholder for value %o', async (value) => {
    render(<LabelledValue label='Name' value={value} />)

    expect(await screen.findByText('Empty')).toBeDefined()
  })

  it('uses a custom placeholder when emptyText is set', async () => {
    render(<LabelledValue label='Description' emptyText='No description' />)

    expect(await screen.findByText('No description')).toBeDefined()
  })

  it('renders children in place of the value', async () => {
    render(
      <LabelledValue label='Name' value='Minimal Schema v10'>
        <span>Editing</span>
      </LabelledValue>,
    )

    expect(await screen.findByText('Editing')).toBeDefined()
    expect(screen.queryByText('Minimal Schema v10')).toBeNull()
  })

  it('renders an action when one is provided', async () => {
    render(<LabelledValue label='Name' value='Minimal Schema v10' action={<button>Edit</button>} />)

    expect(await screen.findByRole('button', { name: 'Edit' })).toBeDefined()
  })

  it('omits the action when one is not provided', () => {
    render(<LabelledValue label='Name' value='Minimal Schema v10' />)

    expect(screen.queryByRole('button')).toBeNull()
  })
})
