/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import FileInput from './FileInput'
import { doNothing } from '../../utils/testUtils'

describe('FileInput', () => {
  it('renders an FileInput component', async () => {
    render(<FileInput label='input' onChange={doNothing} />)

    await waitFor(async () => {
      expect(await screen.findByLabelText('input')).not.toBeUndefined()
    })
  })
})
