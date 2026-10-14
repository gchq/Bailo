import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import LimitedTextField from '../../src/common/LimitedTextField'
import { NAME_INPUT_MAX_LENGTH, TEXT_INPUT_MAX_LENGTH } from '../../utils/inputLimits'

describe('LimitedTextField', () => {
  it('applies the default text limit', async () => {
    render(<LimitedTextField label='Search' />)

    const input = await screen.findByRole('textbox', { name: 'Search' })
    expect(input.getAttribute('maxlength')).toBe(String(TEXT_INPUT_MAX_LENGTH))
  })

  it('applies a custom limit', async () => {
    render(<LimitedTextField label='Name' maxLength={NAME_INPUT_MAX_LENGTH} />)

    const input = await screen.findByRole('textbox', { name: 'Name' })
    expect(input.getAttribute('maxlength')).toBe(String(NAME_INPUT_MAX_LENGTH))
  })

  it('preserves other htmlInput props', async () => {
    render(
      <LimitedTextField
        label='Name'
        maxLength={NAME_INPUT_MAX_LENGTH}
        slotProps={{ htmlInput: { 'data-test': 'custom-input' } }}
      />,
    )

    const input = await screen.findByRole('textbox', { name: 'Name' })
    expect(input.getAttribute('maxlength')).toBe(String(NAME_INPUT_MAX_LENGTH))
    expect(input.getAttribute('data-test')).toBe('custom-input')
  })

  it('preserves a callback htmlInput slot', async () => {
    render(
      <LimitedTextField
        label='Name'
        maxLength={NAME_INPUT_MAX_LENGTH}
        slotProps={{ htmlInput: () => ({ 'data-test': 'fn-input' }) }}
      />,
    )

    const input = await screen.findByRole('textbox', { name: 'Name' })
    expect(input.getAttribute('maxlength')).toBe(String(NAME_INPUT_MAX_LENGTH))
    expect(input.getAttribute('data-test')).toBe('fn-input')
  })
})
