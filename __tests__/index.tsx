/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Marketplace from '../pages/index'

describe('Marketplace', () => {
  it('renders a heading', async () => {
    render(<Marketplace />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: /models/i,
        })
      ).toBeInTheDocument()
    })
  })
})
