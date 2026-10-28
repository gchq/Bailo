import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DraftBanner } from '../../../../src/entry/model/releases/DraftBanner'

function renderDraftBanner(validateBeforeSubmit: () => boolean, overrides: { buttonText?: string; dialogMessage?: string } = {}) {
  const handleSubmit = vi.fn()
  render(
    <DraftBanner
      text='This is a draft'
      draft
      showButton
      dialogTitle='Confirm submission'
      disableButton={false}
      isLoading={false}
      setErrorMessage={vi.fn()}
      handleSubmit={handleSubmit}
      validateBeforeSubmit={validateBeforeSubmit}
      {...overrides}
    />,
  )
  return handleSubmit
}

describe('DraftBanner', () => {
  it('validates before opening the confirmation dialogue', async () => {
    const handleSubmit = renderDraftBanner(() => false)

    await userEvent.click(screen.getByRole('button', { name: 'Submit for Review' }))

    expect(screen.queryByText('Confirm submission')).toBe(null)
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('opens the confirmation dialogue when validation passes', async () => {
    renderDraftBanner(() => true)

    await userEvent.click(screen.getByRole('button', { name: 'Submit for Review' }))

    expect(screen.getByText('Confirm submission')).toBeDefined()
    expect(screen.getByText('Are you sure you want to submit this for review? This is irreversible.')).toBeDefined()
  })

  it('uses custom button text and dialogue message when provided', async () => {
    renderDraftBanner(() => true, { buttonText: 'Publish', dialogMessage: 'Publishing cannot be undone.' })

    expect(screen.queryByRole('button', { name: 'Submit for Review' })).toBe(null)
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(screen.getByText('Publishing cannot be undone.')).toBeDefined()
  })
})
