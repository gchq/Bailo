import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import EditableText from '../../src/common/EditableText'

describe('EditableText', () => {
  it('renders the value beneath the label when one is provided', async () => {
    render(<EditableText label='Name' value='Minimal Schema v10' onSubmit={vi.fn()} />)

    expect(await screen.findByText('Name')).toBeDefined()
    expect(await screen.findByText('Minimal Schema v10')).toBeDefined()
  })

  it('hides the edit button while editing', async () => {
    render(<EditableText label='Name' value='Minimal Schema v10' onSubmit={vi.fn()} tooltipText='Edit schema name' />)

    await userEvent.click(await screen.findByRole('button', { name: 'Edit schema name' }))

    expect(screen.queryByRole('button', { name: 'Edit schema name' })).toBeNull()
    expect(await screen.findByRole('button', { name: 'Submit' })).toBeDefined()
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeDefined()
  })

  it('submits the edited value', async () => {
    const onSubmit = vi.fn()
    render(<EditableText label='Name' value='Original' onSubmit={onSubmit} tooltipText='Edit schema name' />)

    await userEvent.click(await screen.findByRole('button', { name: 'Edit schema name' }))
    await userEvent.clear(await screen.findByRole('textbox', { name: 'Name' }))
    await userEvent.type(await screen.findByRole('textbox', { name: 'Name' }), 'Updated')
    await userEvent.click(await screen.findByRole('button', { name: 'Submit' }))

    expect(onSubmit).toHaveBeenCalledWith('Updated')
  })

  it('does not submit when the value is unchanged', async () => {
    const onSubmit = vi.fn()
    render(<EditableText label='Name' value='Original' onSubmit={onSubmit} tooltipText='Edit schema name' />)

    await userEvent.click(await screen.findByRole('button', { name: 'Edit schema name' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Submit' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('resyncs with the latest value when re-entering edit mode', async () => {
    const { rerender } = render(<EditableText label='Name' value='Original' onSubmit={vi.fn()} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Edit this text' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    rerender(<EditableText label='Name' value='Changed elsewhere' onSubmit={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit this text' }))

    expect((await screen.findByRole<HTMLInputElement>('textbox', { name: 'Name' })).value).toBe('Changed elsewhere')
  })
})
