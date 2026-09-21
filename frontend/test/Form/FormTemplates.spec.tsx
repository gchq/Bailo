import { ThemeProvider } from '@mui/material/styles'
import { FieldErrorProps, FieldTemplateProps, RJSFSchema, RJSFValidationError } from '@rjsf/utils'
import { render, screen } from '@testing-library/react'
import { ErrorListTemplate, FieldErrorTemplate, FieldTemplate } from 'src/Form/FormTemplates'
import { lightTheme } from 'src/theme'
import { describe, expect, it } from 'vitest'

function buildFieldTemplate(
  rawErrors: string[] = [],
  hidden = false,
  children: FieldTemplateProps['children'] = <div data-test='fieldChildren' />,
) {
  const props = {
    id: 'root_deployment_status',
    schema: { type: 'string', title: 'Status' },
    hidden,
    children,
    rawErrors,
    errors: rawErrors.length ? <span>{rawErrors.join(', ')}</span> : undefined,
    registry: { formContext: { state: {} } },
  } as FieldTemplateProps

  return (
    <ThemeProvider theme={lightTheme}>
      <FieldTemplate {...props} />
    </ThemeProvider>
  )
}

function renderTemplate(element: ReturnType<typeof buildFieldTemplate>) {
  return render(element)
}

describe('FieldTemplate', () => {
  it('marks a field that failed validation', async () => {
    renderTemplate(buildFieldTemplate(['This field is required']))

    expect(await screen.findByText('This field is required')).toBeDefined()
  })

  it('renders whatever message RJSF supplies', async () => {
    renderTemplate(buildFieldTemplate(['must NOT have more than 2 items']))

    expect(await screen.findByText('must NOT have more than 2 items')).toBeDefined()
    expect(screen.queryByText('This field is required')).toBeNull()
  })

  it('does not mark a field that passed validation', () => {
    renderTemplate(buildFieldTemplate())

    expect(screen.queryByText('This field is required')).toBeNull()
    expect(screen.getByTestId('fieldChildren')).toBeDefined()
  })

  it('keeps the input focused when its validation error clears', () => {
    const input = <input data-test='fieldChildren' />
    const { rerender } = render(buildFieldTemplate(['This field is required'], false, input))

    screen.getByRole('textbox').focus()
    expect(document.activeElement).toBe(screen.getByRole('textbox'))

    rerender(buildFieldTemplate([], false, input))

    expect(screen.queryByText('This field is required')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('textbox'))
  })

  it('keeps hidden fields hidden even when they failed validation', () => {
    renderTemplate(buildFieldTemplate(['This field is required'], true))

    expect(screen.queryByText('This field is required')).toBeNull()
    expect(screen.getByTestId('fieldChildren').parentElement).toHaveProperty('style.display', 'none')
  })
})

describe('FieldErrorTemplate', () => {
  const renderFieldErrors = (errors: string[]) =>
    render(
      <ThemeProvider theme={lightTheme}>
        <FieldErrorTemplate {...({ errors, fieldPathId: { $id: 'root_overview_name' } } as FieldErrorProps)} />
      </ThemeProvider>,
    )

  it('renders each error with a marker', async () => {
    renderFieldErrors(['This field is required', 'must be string'])

    expect(await screen.findByText('This field is required')).toBeDefined()
    expect(await screen.findByText('must be string')).toBeDefined()
    expect(screen.getAllByLabelText('Error for root_overview_name')).toHaveLength(2)
  })

  it('renders nothing when the field is valid', () => {
    const { container } = renderFieldErrors([])

    expect(container.childElementCount).toBe(0)
  })
})

describe('ErrorListTemplate', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      name: { title: 'Name of Deployment', type: 'string' },
      tags: { title: 'Applicable tags', type: 'array', items: { type: 'string' } },
      owners: {
        title: 'Owners',
        type: 'array',
        items: { type: 'object', properties: { email: { title: 'Owner email address', type: 'string' } } },
      },
    },
  }

  const renderErrorList = (errors: RJSFValidationError[]) =>
    render(
      <ThemeProvider theme={lightTheme}>
        <ErrorListTemplate errors={errors} schema={schema} />
      </ThemeProvider>,
    )

  it('uses the title RJSF resolved for the error', async () => {
    renderErrorList([
      { name: 'required', property: 'name', message: 'This field is required', title: 'Name of Deployment' },
    ] as RJSFValidationError[])

    expect(await screen.findByText('Name of Deployment: This field is required')).toBeDefined()
  })

  it('falls back to the question in the schema when the error has no title', async () => {
    // `customValidate` errors arrive without a title, so they must resolve the question themselves
    renderErrorList([{ property: '.tags', message: 'This field is required' }] as RJSFValidationError[])

    expect(await screen.findByText('Applicable tags: This field is required')).toBeDefined()
  })

  it('resolves the question of a field inside an array item', async () => {
    renderErrorList([{ property: '.owners.0.email', message: 'This field is required' }] as RJSFValidationError[])

    expect(await screen.findByText('Owner email address: This field is required')).toBeDefined()
  })

  it('falls back to the field name when the schema has no question', async () => {
    renderErrorList([{ property: '.modelIds', message: 'This field is required' }] as RJSFValidationError[])

    expect(await screen.findByText('Model Ids: This field is required')).toBeDefined()
  })
})
