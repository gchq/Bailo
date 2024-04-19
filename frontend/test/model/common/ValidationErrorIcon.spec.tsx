import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { MarkdownDisplayProps } from 'src/common/MarkdownDisplay'
import ValidationErrorIcon from 'src/entry/model/common/ValidationErrorIcon'
import { lightTheme } from 'src/theme'
import { testAccessRequestSchemaStepNoRender } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

vi.mock('src/common/MarkdownDisplay.tsx', () => ({ default: (_props: MarkdownDisplayProps) => <></> }))

describe('ValidationErrorIcon', () => {
  it('displays a validation warning message when the form step is marked as incomplete', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <ValidationErrorIcon step={testAccessRequestSchemaStepNoRender} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByTestId('formStepValidationWarning')).toBeDefined()
    })
  })

  it('does not display a validation warning message when the form step is marked as complete', async () => {
    const step = {
      ...testAccessRequestSchemaStepNoRender,
      isComplete: () => true,
    }
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <ValidationErrorIcon step={step} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(container.childElementCount).toEqual(0)
    })
  })
})
