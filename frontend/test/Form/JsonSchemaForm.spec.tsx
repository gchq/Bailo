import { ThemeProvider } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

  describe('inline live validation', () => {
    const textSchema = {
      id: 'text-schema',
      reference: 'text-schema',
      jsonSchema: {
        type: 'object',
        properties: {
          details: {
            type: 'object',
            title: 'Details',
            properties: {
              name: { type: 'string', title: 'Name', maxLength: 3, requiredByModelStates: ['Development'] },
            },
          },
        },
      },
    }

    function renderTextForm() {
      const steps = getStepsFromSchema(textSchema, {}, [], {})
      for (const step of steps) {
        step.steps = steps
      }
      renderWithTheme(
        <JsonSchemaForm
          splitSchema={{ reference: textSchema.id, steps }}
          setSplitSchema={vi.fn()}
          canEdit
          stateList={['Development']}
        />,
      )
    }

    afterEach(() => {
      mockRouter.setCurrentUrl('/')
    })

    it('displays errors inline as the user types', async () => {
      renderTextForm()

      fireEvent.change(await screen.findByLabelText('text input field for Name'), { target: { value: 'too long' } })

      expect(await screen.findByText(/must NOT have more than 3 characters/)).toBeDefined()
    })

    it('displays errors inline when highlighting fields required by a model state', async () => {
      mockRouter.setCurrentUrl('/?requiredByModelState=Development')
      renderTextForm()

      fireEvent.change(await screen.findByLabelText('text input field for Name'), { target: { value: 'too long' } })

      expect(await screen.findByText(/must NOT have more than 3 characters/)).toBeDefined()
      expect(screen.getByText('Required for Development')).toBeDefined()
    })
  })
})
