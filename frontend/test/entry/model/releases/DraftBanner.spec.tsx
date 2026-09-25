import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DraftBanner } from '../../../../src/entry/model/releases/DraftBanner'

function renderDraftBanner(validateBeforePublish: () => boolean) {
  const handlePublish = vi.fn()
  render(
    <DraftBanner
      text='This is a draft'
      draft
      showButton
      dialogTitle='Confirm publish'
      disableButton={false}
      isLoading={false}
      setErrorMessage={vi.fn()}
      handlePublish={handlePublish}
      validateBeforePublish={validateBeforePublish}
    />,
  )
  return handlePublish
}

describe('DraftBanner', () => {
  it('validates before opening the confirmation dialogue', async () => {
    const handlePublish = renderDraftBanner(() => false)

    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(screen.queryByText('Confirm publish')).toBe(null)
    expect(handlePublish).not.toHaveBeenCalled()
  })

  it('opens the confirmation dialogue when validation passes', async () => {
    renderDraftBanner(() => true)

    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(screen.getByText('Confirm publish')).toBeDefined()
  })
})
