/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import FileInput from './FileInput'

describe('FileInput', () => {
  const onChange = (_newVal: any) => {
    /* do nothing */
  }

  it('renders an FileInput component', async () => {
    render(<FileInput label='input' onChange={onChange} />)

    await waitFor(async () => {
      expect(await screen.findByLabelText('input')).not.toBeUndefined()
    })
  })
})
