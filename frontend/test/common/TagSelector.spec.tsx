import { ThemeProvider } from '@mui/material/styles'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import TagSelector from 'src/MuiForms/TagSelector'
import { lightTheme } from 'src/theme'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(cleanup)

describe('add-only tag selector', () => {
  it('adds a tag without displaying removal controls', () => {
    const onChange = vi.fn()
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <TagSelector id='tags' label='Tags' value={['existing']} onChange={onChange} allowDelete={false} />
      </ThemeProvider>,
    )
    expect(container.querySelector('.MuiChip-deleteIcon')).toBeNull()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' new ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    expect(onChange).toHaveBeenCalledWith(['existing', 'new'])
  })

  it('keeps tag removal available by default', () => {
    const onChange = vi.fn()
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <TagSelector id='tags' label='Tags' value={['existing']} onChange={onChange} />
      </ThemeProvider>,
    )
    const removeIcon = container.querySelector('.MuiChip-deleteIcon')
    expect(removeIcon).not.toBeNull()
    fireEvent.click(removeIcon!)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('rejects case-insensitive duplicates in add-only mode', () => {
    const onChange = vi.fn()
    render(
      <ThemeProvider theme={lightTheme}>
        <TagSelector id='tags' label='Tags' value={['existing']} onChange={onChange} allowDelete={false} />
      </ThemeProvider>,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' EXISTING ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('You cannot add duplicate tags')).toBeDefined()
  })
})
