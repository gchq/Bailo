import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DraftBanner } from '../../../../src/entry/model/releases/DraftBanner'

function renderDraftBanner(validateBeforeSubmitForReview: () => boolean) {
  const handleSubmitForReview = vi.fn()
  render(
    <DraftBanner
      text='This is a draft'
      draft
      showButton
      dialogTitle='Publish'
      disableButton={false}
      isLoading={false}
      setErrorMessage={vi.fn()}
      handleSubmitForReview={handleSubmitForReview}
      validateBeforeSubmitForReview={validateBeforeSubmitForReview}
    />,
  )
  return handleSubmitForReview
}

describe('DraftBanner', () => {
  it('validates before opening the confirmation dialogue', async () => {
    const handleSubmitForReview = renderDraftBanner(() => false)

    await userEvent.click(screen.getByRole('button', { name: 'Submit for Review' }))

    expect(screen.queryByText('Publish')).toBe(null)
    expect(handleSubmitForReview).not.toHaveBeenCalled()
  })

  it('opens the confirmation dialogue when validation passes', async () => {
    renderDraftBanner(() => true)

    await userEvent.click(screen.getByRole('button', { name: 'Submit for Review' }))

    expect(screen.getByText('Publish')).toBeDefined()
  })
})
