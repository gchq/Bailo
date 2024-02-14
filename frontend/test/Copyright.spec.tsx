import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Copyright from '../src/Copyright'

describe('Copyright', () => {
  it('renders a Copyright component', async () => {
    render(<Copyright />)

    await waitFor(async () => {
      expect(await screen.findByText('Crown Copyright')).toBeDefined()
    })
  })
})
