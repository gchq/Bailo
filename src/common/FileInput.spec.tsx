/**
 * @jest-environment jsdom
 */

import FileInput from './FileInput'
import { render, screen, waitFor } from '@testing-library/react'

describe('FileInput', () => {
  const onChange = (_newVal: any) => {}

  it('renders an FileInput component', async () => {
    render(<FileInput label='input' onChange={onChange} />)

    await waitFor(async () => {
      expect(await screen.findByLabelText('input')).not.toBeUndefined()
    })
  })
})
