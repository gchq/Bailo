/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import ConfirmationDialogue from './ConfirmationDialogue'

const handleCancel = () => {
  // dummy function
}

const handleConfirm = () => {
  // dummy function
}

describe('ConfirmationDialogue', () => {
  it('renders a ConfirmationDialogue component', async () => {
    render(
      <ConfirmationDialogue
        showConfirmationDialogue
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        confirmationModalTitle='Test dialogue title'
        confirmationModalText='Test dialogue text'
      />
    )

    await waitFor(async () => {
      expect(await screen.findByText('Test dialogue title')).not.toBeUndefined()
    })
  })

  it('does not render a ConfirmationDialogue component', async () => {
    render(
      <ConfirmationDialogue
        showConfirmationDialogue={false}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        confirmationModalTitle='Test dialogue title'
        confirmationModalText='Test dialogue text'
      />
    )

    await waitFor(async () => {
      expect(await screen.queryByText('Test dialogue title')).toBeNull()
    })
  })
})
