import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ReviewWithComment from './ReviewWithComment'

describe('ReviewWithComment', () => {
  it('renders an ReviewWithComment component', async () => {
    render(
      <ReviewWithComment
        title='Review model'
        description='Please review this model'
        open={true}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />
    )

    await waitFor(async () => {
      expect(await screen.findByText('Review model')).not.toBeUndefined()
      expect(await screen.findByText('Please review this model')).not.toBeUndefined()
    })
  })

  it('renders an error message when trying to reject without comment', async () => {
    render(
      <ReviewWithComment
        title='Review model'
        description='Please review this model'
        open={true}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />
    )

    await waitFor(async () => {
      const rejectButton = await screen.findByText('Reject')
      fireEvent.click(rejectButton)
      expect(
        await screen.findByText('You must submit a comment when either rejecting or requesting changes.')
      ).not.toBeUndefined()
    })
  })
})
