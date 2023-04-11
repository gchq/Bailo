/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { doNothing } from '../../utils/testUtils'
import FileInput from './FileInput'

describe('FileInput', () => {
  it('renders an FileInput component', async () => {
    render(<FileInput label='input' onChange={doNothing} />)

    await waitFor(async () => {
      expect(await screen.findByLabelText('input')).not.toBeUndefined()
    })
  })
})
