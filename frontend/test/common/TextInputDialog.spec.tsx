import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { doNothing } from 'utils/test/testUtils'
import { describe, expect, it, vi } from 'vitest'

import TextInputDialog from '../../src/common/TextInputDialog'

describe('TextInputDialog', () => {
  it(`'fires the onClick event when the submit button is clicked`, async () => {
    const handleClickSpy = vi.fn()
    render(<TextInputDialog open setOpen={doNothing} onSubmit={handleClickSpy} submitButtonText='Test Button' />)

    await waitFor(async () => {
      const submitButton = screen.getByTestId('dialogSubmitButton')
      fireEvent.click(submitButton)
      expect(handleClickSpy).toHaveBeenCalledOnce()
    })
  })
})
