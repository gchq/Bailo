import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import JsonSchemaForm from '../../src/Form/JsonSchemaForm'
import { lightTheme } from '../../src/theme'
import { SplitSchemaNoRender } from '../../types/types'
import { getStepsFromSchema } from '../../utils/formUtils'

const testSchema = {
  id: 'test-schema',
  reference: 'test-schema',
  jsonSchema: {
    type: 'object',
    properties: {
      details: {
        type: 'object',
        title: 'Details',
        properties: {
          riskOwners: {
            type: 'array',
            title: 'Who is the risk owner?',
            items: { type: 'string' },
            minItems: 1,
          },
          name: { type: 'string', title: 'Name', minLength: 5 },
        },
        required: ['riskOwners', 'name'],
      },
      about: {
        type: 'object',
        title: 'About',
        properties: {
          summary: { type: 'string', title: 'Summary' },
        },
        required: ['summary'],
      },
    },
  },
}

function buildSplitSchema(state: any = {}): SplitSchemaNoRender {
  const steps = getStepsFromSchema(testSchema, {}, [], state)
  for (const step of steps) {
    step.steps = steps
  }
  return { reference: testSchema.id, steps }
}

function renderWithTheme(children: ReactNode) {
  return render(<ThemeProvider theme={lightTheme}>{children}</ThemeProvider>)
}

function errorListText() {
  return screen.getAllByTestId('formErrorListItem').map((item) => item.textContent)
}

describe('JsonSchemaForm', () => {
  it('does not display validation errors when showValidation is not set', async () => {
    renderWithTheme(<JsonSchemaForm splitSchema={buildSplitSchema()} setSplitSchema={vi.fn()} canEdit />)

    await waitFor(() => expect(screen.getByLabelText('Label for Name')).toBeDefined())
    expect(screen.queryByText('Please resolve the following errors')).toBe(null)
    expect(screen.queryByText('This field is required')).toBe(null)
  })

  it('displays validation errors at the top of the page and against the field when showValidation is set', async () => {
    renderWithTheme(<JsonSchemaForm splitSchema={buildSplitSchema()} setSplitSchema={vi.fn()} canEdit showValidation />)

    await waitFor(() => expect(screen.getByText('Please resolve the following errors')).toBeDefined())
    // Inline against the field, and prefixed with the field title in the list at the top of the page
    expect(screen.getAllByText('This field is required').length).toBeGreaterThan(0)
    expect(screen.getByText('Name: This field is required')).toBeDefined()
  })

  it('does not display validation errors when the required fields have been answered', async () => {
    renderWithTheme(
      <JsonSchemaForm
        splitSchema={buildSplitSchema({ details: { riskOwners: ['user:user'], name: 'A name' } })}
        setSplitSchema={vi.fn()}
        canEdit
        showValidation
      />,
    )

    await waitFor(() => expect(screen.getByLabelText('Label for Name')).toBeDefined())
    expect(screen.queryByText('Please resolve the following errors')).toBe(null)
    expect(screen.queryByText('This field is required')).toBe(null)
  })

  it('lists errors in question order, with a consistent order for a field with several errors', async () => {
    renderWithTheme(
      <JsonSchemaForm
        splitSchema={buildSplitSchema({ details: { name: 'abc' } })}
        setSplitSchema={vi.fn()}
        canEdit
        showValidation
      />,
    )

    await waitFor(() => expect(screen.getByText('Please resolve the following errors')).toBeDefined())
    expect(errorListText()).toEqual([
      'Who is the risk owner?: must NOT have fewer than 1 items',
      'Who is the risk owner?: This field is required',
      'Name: must NOT have fewer than 5 characters',
    ])
  })

  it('reports an empty required array against the question rather than against a hidden item', async () => {
    renderWithTheme(<JsonSchemaForm splitSchema={buildSplitSchema()} setSplitSchema={vi.fn()} canEdit showValidation />)

    await waitFor(() => expect(screen.getByText('Please resolve the following errors')).toBeDefined())
    expect(errorListText()).toContain('Who is the risk owner?: must NOT have fewer than 1 items')
    expect(errorListText()).not.toContain('must be string')
    expect(screen.getByText('must NOT have fewer than 1 items')).toBeDefined()
  })

  it('uses the same errors when validation is switched on after mount, e.g. when publishing a draft', async () => {
    const splitSchema = buildSplitSchema()
    const { rerender } = renderWithTheme(
      <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={vi.fn()} showValidation={false} />,
    )

    rerender(
      <ThemeProvider theme={lightTheme}>
        <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={vi.fn()} showValidation />
      </ThemeProvider>,
    )

    await waitFor(() => expect(screen.getByText('Please resolve the following errors')).toBeDefined())
    expect(errorListText()).toEqual([
      'Who is the risk owner?: must NOT have fewer than 1 items',
      'Who is the risk owner?: This field is required',
      'Name: This field is required',
    ])
  })

  it('treats an array of blank values as an empty array', async () => {
    renderWithTheme(
      <JsonSchemaForm
        splitSchema={buildSplitSchema({ details: { riskOwners: [''], name: 'A name' } })}
        setSplitSchema={vi.fn()}
        canEdit
        showValidation
      />,
    )

    await waitFor(() => expect(screen.getByText('Please resolve the following errors')).toBeDefined())
    expect(errorListText()).toEqual([
      'Who is the risk owner?: must NOT have fewer than 1 items',
      'Who is the risk owner?: This field is required',
    ])
  })

  it('keeps the inline errors when navigating to another page', async () => {
    renderWithTheme(<JsonSchemaForm splitSchema={buildSplitSchema()} setSplitSchema={vi.fn()} canEdit showValidation />)

    await waitFor(() => expect(screen.getByText('Please resolve the following errors')).toBeDefined())
    await userEvent.click(screen.getByRole('button', { name: 'About' }))

    await waitFor(() => expect(screen.getByLabelText('Label for Summary')).toBeDefined())
    expect(errorListText()).toEqual(['Summary: This field is required'])
    expect(screen.getByText('This field is required')).toBeDefined()
  })

  it('keeps the focus on a field that is being typed into while it has an error', async () => {
    renderWithTheme(<JsonSchemaForm splitSchema={buildSplitSchema()} setSplitSchema={vi.fn()} canEdit showValidation />)

    await waitFor(() => expect(screen.getByText('Please resolve the following errors')).toBeDefined())
    const nameInput = screen.getByLabelText('text input field for Name')

    await userEvent.type(nameInput, 'A name')

    expect(document.activeElement).toBe(nameInput)
  })
})
