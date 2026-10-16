import { ThemeProvider } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { render, screen, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import JsonSchemaForm from '../../src/Form/JsonSchemaForm'
import { lightTheme } from '../../src/theme'
import { getStepsFromSchema } from '../../utils/formUtils'

function renderWithTheme(children: ReactNode) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
        {children}
      </LocalizationProvider>
    </ThemeProvider>,
  )
}

describe('JsonSchemaForm', () => {
  it('leaves an unanswered required boolean unanswered rather than defaulting it to false', async () => {
    const booleanSchema = {
      id: 'boolean-schema',
      reference: 'boolean-schema',
      jsonSchema: {
        type: 'object',
        properties: {
          details: {
            type: 'object',
            title: 'Details',
            properties: {
              agreed: { type: 'boolean', title: 'Agreed' },
            },
            required: ['agreed'],
          },
        },
      },
    }
    const steps = getStepsFromSchema(booleanSchema, {}, [], {})
    for (const step of steps) {
      step.steps = steps
    }

    renderWithTheme(
      <JsonSchemaForm splitSchema={{ reference: booleanSchema.id, steps }} setSplitSchema={vi.fn()} canEdit />,
    )

    await waitFor(() => expect(screen.getByLabelText('radio input field for Agreed')).toBeDefined())
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Yes' }).checked).toBe(false)
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'No' }).checked).toBe(false)
  })
})
