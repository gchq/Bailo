/**
 * @jest-environment jsdom
 */

import Box from '@mui/material/DialogContentText'
import { render, screen, waitFor } from '@testing-library/react'
import ConfirmationDialogue from './ConfirmationDialogue'

const handleCancel = () => {
  // dummy function
}

const handleConfirm = () => {
  // dummy function
}

describe('ConfirmationDialogue', () => {
  const testTitle = 'Test dialogue title'
  const testText = 'Test dialogue text'
  const testContent = <Box>{testText}</Box>

  it('renders a ConfirmationDialogue component', async () => {
    render(
      <ConfirmationDialogue
        showConfirmationDialogue
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        confirmationModalTitle={testTitle}
        confirmationContent={testContent}
      />
    )

    await waitFor(async () => {
      expect(await screen.findByText(testTitle)).not.toBeUndefined()
      expect(await screen.findByText(testText)).not.toBeUndefined()
    })
  })

  it('does not render a ConfirmationDialogue component', async () => {
    render(
      <ConfirmationDialogue
        showConfirmationDialogue={false}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        confirmationModalTitle={testTitle}
        confirmationContent={testContent}
      />
    )

    await waitFor(async () => {
      expect(await screen.queryByText(testTitle)).toBeNull()
      expect(await screen.queryByText(testText)).toBeNull()
    })
  })
})
