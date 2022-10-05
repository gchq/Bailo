/**
 * @jest-environment jsdom
 */

import { doNothing } from '@/utils/tests'
import { render, screen, waitFor } from '@testing-library/react'
import ConfirmationDialogue from './ConfirmationDialogue'

describe('ConfirmationDialogue', () => {
  const testTitle = 'Test dialogue title'
  const testError = 'Test dialogue text'

  it('renders a ConfirmationDialogue component', async () => {
    render(
      <ConfirmationDialogue
        open
        onCancel={doNothing}
        onConfirm={doNothing}
        title={testTitle}
        errorMessage={testError}
      />
    )

    await waitFor(async () => {
      expect(await screen.findByText(testTitle)).not.toBeUndefined()
      expect(await screen.findByText(testError)).not.toBeUndefined()
    })
  })

  it('does not render a ConfirmationDialogue component', async () => {
    render(
      <ConfirmationDialogue
        open={false}
        onCancel={doNothing}
        onConfirm={doNothing}
        title={testTitle}
        errorMessage={testError}
      />
    )

    await waitFor(async () => {
      expect(await screen.queryByText(testTitle)).toBeNull()
      expect(await screen.queryByText(testError)).toBeNull()
    })
  })
})
