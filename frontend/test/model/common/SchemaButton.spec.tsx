import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MarkdownDisplayProps } from 'src/common/MarkdownDisplay'
import SchemaButton from 'src/model/beta/common/SchemaButton'
import { lightTheme } from 'src/theme'
import { testAccessRequestSchema } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

vi.mock('src/common/MarkdownDisplay.tsx', () => ({ default: (_props: MarkdownDisplayProps) => <></> }))
const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined)

describe('SchemaButton', () => {
  it('enters a loading state when the loading prop is true', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SchemaButton schema={testAccessRequestSchema} onClick={() => undefined} loading />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByRole('progressbar')).toBeDefined()
    })
  })

  it('is not in a loading state when the loading prop is false', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SchemaButton schema={testAccessRequestSchema} onClick={() => undefined} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      const loadingSpinner = await screen.queryByRole('progressbar')
      expect(loadingSpinner).toBeNull()
    })
  })

  it('is not in a loading state when the loading prop is false', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SchemaButton schema={testAccessRequestSchema} onClick={() => undefined} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      const loadingSpinner = await screen.queryByRole('progressbar')
      expect(loadingSpinner).toBeNull()
    })
  })

  it('fires the onClick event', async () => {
    const testMessage = 'The schema button has been clicked!'

    function onClick() {
      // eslint-disable-next-line no-console
      console.log(testMessage)
    }
    render(
      <ThemeProvider theme={lightTheme}>
        <SchemaButton schema={testAccessRequestSchema} onClick={onClick} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      const schemaButton = screen.getByTestId('selectSchemaButton-access-request-schema')
      fireEvent.click(schemaButton)
      expect(consoleMock).toHaveBeenCalledOnce()
      expect(consoleMock).toHaveBeenLastCalledWith(testMessage)
    })
  })
})
