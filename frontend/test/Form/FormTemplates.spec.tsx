import { ThemeProvider } from '@mui/material/styles'
import { FieldTemplateProps } from '@rjsf/utils'
import { render, screen } from '@testing-library/react'
import { FieldTemplate } from 'src/Form/FormTemplates'
import { lightTheme } from 'src/theme'
import { describe, expect, it } from 'vitest'

function buildFieldTemplate(
  id: string,
  schema: FieldTemplateProps['schema'],
  invalidFields?: Map<string, string>,
  hidden = false,
  children: FieldTemplateProps['children'] = <div data-test='fieldChildren' />,
) {
  const props = {
    id,
    schema,
    hidden,
    children,
    registry: { formContext: { state: {}, invalidFields } },
  } as FieldTemplateProps

  return (
    <ThemeProvider theme={lightTheme}>
      <FieldTemplate {...props} />
    </ThemeProvider>
  )
}

function renderFieldTemplate(
  id: string,
  schema: FieldTemplateProps['schema'],
  invalidFields?: Map<string, string>,
  hidden = false,
) {
  return render(buildFieldTemplate(id, schema, invalidFields, hidden))
}

describe('FieldTemplate', () => {
  it('marks a field that failed validation', async () => {
    renderFieldTemplate(
      'root_deployment_status',
      { type: 'string', title: 'Status' },
      new Map([['deployment.status', 'This field is required']]),
    )

    expect(await screen.findByText('This field is required')).toBeDefined()
    expect(await screen.findByLabelText('This field is required: Status')).toBeDefined()
  })

  it('uses the message supplied for the field', async () => {
    renderFieldTemplate(
      'root_deployment_status',
      { type: 'string', title: 'Status' },
      new Map([['deployment.status', 'This field is incomplete']]),
    )

    expect(await screen.findByText('This field is incomplete')).toBeDefined()
    expect(screen.queryByText('This field is required')).toBeNull()
  })

  it('falls back to the field id when the schema has no title', async () => {
    renderFieldTemplate(
      'root_deployment_status',
      { type: 'string' },
      new Map([['deployment.status', 'This field is required']]),
    )

    expect(await screen.findByLabelText('This field is required: root_deployment_status')).toBeDefined()
  })

  it('does not mark a field that passed validation', () => {
    renderFieldTemplate(
      'root_deployment_status',
      { type: 'string', title: 'Status' },
      new Map([['deployment.name', 'This field is required']]),
    )

    expect(screen.queryByText('This field is required')).toBeNull()
    expect(screen.getByTestId('fieldChildren')).toBeDefined()
  })

  it('does not mark any field when there are no validation errors', () => {
    renderFieldTemplate('root_deployment_status', { type: 'string', title: 'Status' }, new Map())

    expect(screen.queryByText('This field is required')).toBeNull()
  })

  it('does not mark any field when validation errors are not being displayed', () => {
    renderFieldTemplate('root_deployment_status', { type: 'string', title: 'Status' })

    expect(screen.queryByText('This field is required')).toBeNull()
  })

  it('does not mark nested object fields, only their leaves', () => {
    renderFieldTemplate(
      'root_deployment',
      { type: 'object', title: 'Deployment' },
      new Map([['deployment', 'This field is required']]),
    )

    expect(screen.queryByText('This field is required')).toBeNull()
    expect(screen.getByTestId('fieldChildren')).toBeDefined()
  })

  it('keeps the input focused when its validation error clears', () => {
    const schema = { type: 'string', title: 'Status' } as FieldTemplateProps['schema']
    const input = <input data-test='fieldChildren' />
    const { rerender } = render(
      buildFieldTemplate(
        'root_deployment_status',
        schema,
        new Map([['deployment.status', 'This field is required']]),
        false,
        input,
      ),
    )

    screen.getByRole('textbox').focus()
    expect(document.activeElement).toBe(screen.getByRole('textbox'))

    rerender(buildFieldTemplate('root_deployment_status', schema, new Map(), false, input))

    expect(screen.queryByText('This field is required')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('textbox'))
  })

  it('keeps hidden fields hidden even when they failed validation', () => {
    renderFieldTemplate(
      'root_deployment_status',
      { type: 'string', title: 'Status' },
      new Map([['deployment.status', 'This field is required']]),
      true,
    )

    expect(screen.queryByText('This field is required')).toBeNull()
    expect(screen.getByTestId('fieldChildren').parentElement).toHaveProperty('style.display', 'none')
  })
})
