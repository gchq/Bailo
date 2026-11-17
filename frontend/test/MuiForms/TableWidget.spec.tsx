import { fireEvent, render, screen } from '@testing-library/react'
import TableWidget from 'src/MuiForms/TableWidget'
import { describe, expect, it, vi } from 'vitest'

const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      risk: { title: 'Risk', type: 'string' },
      mitigation: { title: 'Mitigation', type: 'string' },
    },
  },
} as any

const id = 'root_risksAndMitigations'
const rows = [{ risk: 'Data drift', mitigation: 'Monthly retraining' }]

function renderWidget(formContext: Record<string, unknown>, value = rows, onChange = vi.fn()) {
  render(
    <TableWidget
      id={id}
      label='Risks and mitigations'
      schema={schema}
      registry={{ formContext } as any}
      value={value}
      onChange={onChange}
    />,
  )
  return onChange
}

describe('TableWidget', () => {
  it('shows an error when the form context is missing', () => {
    render(<TableWidget id={id} label='Risks' schema={schema} value={rows} onChange={vi.fn()} />)
    expect(screen.getByText('Unable to render widget due to missing context')).toBeDefined()
  })

  it('renders headings from the item property titles and the row values in view mode', () => {
    renderWidget({ editMode: false })
    expect(screen.getByRole('columnheader', { name: 'Risk' })).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'Mitigation' })).toBeDefined()
    expect(screen.getByText('Data drift')).toBeDefined()
    expect(screen.getByText('Monthly retraining')).toBeDefined()
  })

  it('shows unanswered in view mode when there are no rows', () => {
    renderWidget({ editMode: false }, [])
    expect(screen.getByText('Unanswered')).toBeDefined()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('treats an undefined value as no rows', () => {
    render(
      <TableWidget id={id} label='Risks' schema={schema} registry={{ formContext: {} } as any} onChange={vi.fn()} />,
    )
    expect(screen.getByText('Unanswered')).toBeDefined()
  })

  it('adds an empty row with a key for every column', () => {
    const onChange = renderWidget({ editMode: true })
    fireEvent.click(screen.getByRole('button', { name: 'add row button' }))
    expect(onChange).toHaveBeenCalledWith([...rows, { risk: '', mitigation: '' }])
  })

  it('updates only the edited cell', () => {
    const onChange = renderWidget({ editMode: true })
    fireEvent.change(screen.getByLabelText('Mitigation row 1'), { target: { value: 'Weekly retraining' } })
    expect(onChange).toHaveBeenCalledWith([{ risk: 'Data drift', mitigation: 'Weekly retraining' }])
  })

  it('removes a row', () => {
    const onChange = renderWidget({ editMode: true })
    fireEvent.click(screen.getByRole('button', { name: 'remove row 1' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('shows removed rows in compare mode', () => {
    renderWidget(
      {
        editMode: false,
        compareMode: true,
        compareFromState: { risksAndMitigations: [{ risk: 'Old risk', mitigation: 'Old mitigation' }] },
      },
      [],
    )
    expect(screen.queryByText('Unanswered')).toBeNull()
    expect(screen.getByText('Old risk')).toBeDefined()
    expect(screen.getByText('Old mitigation')).toBeDefined()
  })
})
