import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { MarkdownDisplayProps } from 'src/common/MarkdownDisplay'
import ValidationErrorIcon from 'src/model/beta/common/ValidationErrorIcon'
import { lightTheme } from 'src/theme'
import { testAccessRequestSchemaStepNoRender } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

vi.mock('src/common/MarkdownDisplay.tsx', () => ({ default: (_props: MarkdownDisplayProps) => <></> }))

describe('Va;idationError', () => {
  it('renders a ValidationError component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <ValidationErrorIcon step={testAccessRequestSchemaStepNoRender} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByLabelText('This step is unfinished')).not.toBeUndefined()
    })
  })

  it('does not render a ValidationError component when step is marked as complete', async () => {
    const updatedStep = testAccessRequestSchemaStepNoRender
    updatedStep.isComplete = () => true
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <ValidationErrorIcon step={testAccessRequestSchemaStepNoRender} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(container.childElementCount).toEqual(0)
    })
  })
})
