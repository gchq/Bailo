import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SubmissionError from './SubmissionError'

describe('SubmissionError', () => {
  it('renders a SubmissionError component', async () => {
    render(<SubmissionError error='There was an error' />)

    await waitFor(async () => {
      expect(await screen.findByText('There was an error')).not.toBeUndefined()
    })
  })
})
