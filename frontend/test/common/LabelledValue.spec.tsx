import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import LabelledValue from '../../src/common/LabelledValue'

describe('LabelledValue', () => {
  it('renders the label alongside its value', async () => {
    render(
      <LabelledValue label='Name'>
        <span>Minimal Schema v10</span>
      </LabelledValue>,
    )

    expect(await screen.findByText('Name')).toBeDefined()
    expect(await screen.findByText('Minimal Schema v10')).toBeDefined()
  })

  it('renders an action when one is provided', async () => {
    render(
      <LabelledValue label='Name' action={<button>Edit</button>}>
        <span>Minimal Schema v10</span>
      </LabelledValue>,
    )

    expect(await screen.findByRole('button', { name: 'Edit' })).toBeDefined()
  })

  it('omits the action when one is not provided', () => {
    render(
      <LabelledValue label='Name'>
        <span>Minimal Schema v10</span>
      </LabelledValue>,
    )

    expect(screen.queryByRole('button')).toBeNull()
  })
})
