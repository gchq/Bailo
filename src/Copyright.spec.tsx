/**
 * @jest-environment jsdom
 */

import Copyright from './Copyright'
import { render, screen, waitFor } from '@testing-library/react'

describe('Copyright', () => {
  it('renders a Copyright component', async () => {
    render(<Copyright />)

    await waitFor(async () => {
      expect(await screen.findByText('Crown Copyright')).not.toBeUndefined()
    })
  })
})
