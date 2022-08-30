/* eslint-env jest */
/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import Marketplace from '../../pages/index'
import '../../utils/mockJsdom'

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
