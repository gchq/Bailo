import Button from '@mui/material/Button'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import DisabledElementTooltip from './DisabledElementTooltip'

describe('DisabledElementTooltip', () => {
  const testMessage = 'This ia test message'

  it('renders an DisabledElementTooltip component when a button is hovered over', async () => {
    render(
      <DisabledElementTooltip conditions={[testMessage]}>
        <Button data-test='trigger'>Button</Button>
      </DisabledElementTooltip>
    )

    await waitFor(async () => {
      userEvent.hover(screen.getByTestId('trigger'))
      expect(await screen.findByText(testMessage)).not.toBeUndefined()
    })
  })
})
