/**
 * @jest-environment jsdom
 */

import Button from '@mui/material/Button'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DisabledButtonInfo from './DisabledButtonInfo'

describe('DisabledButtonInfo', () => {
  const testMessage = 'This ia test message'

  it('renders an DisabledButtonInfo component when a button is hovered over', async () => {
    render(
      <DisabledButtonInfo conditions={[testMessage]}>
        <Button data-testid='trigger'>Button</Button>
      </DisabledButtonInfo>
    )

    await waitFor(async () => {
      userEvent.hover(screen.getByTestId('trigger'))
      expect(await screen.findByText(testMessage)).not.toBeUndefined()
    })
  })
})
