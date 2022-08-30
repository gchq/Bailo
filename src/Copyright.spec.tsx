/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import Copyright from './Copyright'

describe('Copyright', () => {
  it('renders a Copyright component', async () => {
    render(<Copyright />)

    await waitFor(async () => {
      expect(await screen.findByText('Crown Copyright')).not.toBeUndefined()
    })
  })
})
