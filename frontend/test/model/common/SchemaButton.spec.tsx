import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { MarkdownDisplayProps } from 'src/common/MarkdownDisplay'
import SchemaButton from 'src/model/beta/common/SchemaButton'
import { lightTheme } from 'src/theme'
import { testAccessRequestSchema } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

vi.mock('src/common/MarkdownDisplay.tsx', () => ({ default: (_props: MarkdownDisplayProps) => <></> }))

describe('SchemaButton', () => {
  it('renders a SchemaButton component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SchemaButton schema={testAccessRequestSchema} onClick={() => undefined} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Select schema')).not.toBeUndefined()
    })
  })

  it('renders a loading SchemaButton component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SchemaButton schema={testAccessRequestSchema} onClick={() => undefined} loading />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByRole('progressbar')).not.toBeUndefined()
    })
  })
})
