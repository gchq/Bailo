/**
 * @jest-environment jsdom
 */

import ConfirmationDialogue from './ConfirmationDialogue'
import { render, screen, waitFor } from '@testing-library/react'

const handleCancel = () => {
  //dummy function
}

const handleConfirm = () => {
  //dummy function
}

describe('LoadingBar', () => {
  it('renders a ConfirmationDialogue component', async () => {
    render(
      <ConfirmationDialogue
        showConfirmationDialogue={true}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        confirmationModalTitle='Test dialogue title'
        confirmationModalText='Test dialogue text'
      />
    )

    await waitFor(async () => {
      expect(await screen.findByText('50%')).not.toBeUndefined()
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
      expect(await screen.queryByText('50%')).toBeNull()
    })
  })
})
