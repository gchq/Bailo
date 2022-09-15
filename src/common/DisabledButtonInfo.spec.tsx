/**
 * @jest-environment jsdom
 */

import Button from '@mui/material/Button'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DisabledButtonInfo, { DisabledButtonConditions } from './DisabledButtonInfo'

describe('DisabledButtonInfo', () => {
  const testMessage = 'This ia test message'

  const testConditions: DisabledButtonConditions[] = [
    {
      condition: true,
      message: testMessage,
    },
  ]

  it('renders an DisabledButtonInfo component when a button is hovered over', async () => {
    render(
      <DisabledButtonInfo conditions={testConditions}>
        <Button data-testid='trigger'>Button</Button>
      </DisabledButtonInfo>
    )

    await waitFor(async () => {
      userEvent.hover(screen.getByTestId('trigger'))
      expect(await screen.findByText(testMessage)).not.toBeUndefined()
    })
  })
})
