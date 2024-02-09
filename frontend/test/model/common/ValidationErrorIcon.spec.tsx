import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { MarkdownDisplayProps } from 'src/common/MarkdownDisplay'
import ValidationErrorIcon from 'src/model/beta/common/ValidationErrorIcon'
import { lightTheme } from 'src/theme'
import { testAccessRequestSchemaStepNoRender } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

vi.mock('src/common/MarkdownDisplay.tsx', () => ({ default: (_props: MarkdownDisplayProps) => <></> }))

describe('ValidationErrorIcon', () => {
  it('renders a ValidationErrorIcon component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <ValidationErrorIcon step={testAccessRequestSchemaStepNoRender} />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByLabelText('This step is unfinished')).toBeDefined()
    })
  })

  it('does not render anything when step is marked as complete', async () => {
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
