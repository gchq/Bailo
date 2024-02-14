import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect } from 'vitest'

import HelpPopover from '../../src/common/HelpPopover'

describe('HelpPopover', () => {
  const testMessage = 'This is a test message'

  it('does not display popover when help icon is not hovered over', () => {
    render(<HelpPopover>{testMessage}</HelpPopover>)

    expect(screen.queryByText(testMessage)).toBeNull()
  })
  it('displays popover when help icon is hovered over', async () => {
    const user = userEvent.setup()
    render(<HelpPopover>{testMessage}</HelpPopover>)

    await waitFor(async () => {
      await user.hover(screen.getByTestId('helpIcon'))

      expect(await screen.findByText(testMessage)).toBeDefined()
    })
  })
  it('popover closes when help icon is unhovered', async () => {
    const user = userEvent.setup()
    render(<HelpPopover>{testMessage}</HelpPopover>)
    await waitFor(async () => {
      await user.hover(screen.getByTestId('helpIcon'))
      expect(await screen.findByText(testMessage)).toBeDefined()
      await user.unhover(screen.getByTestId('helpIcon'))
      expect(screen.queryByText(testMessage)).toBeNull()
    })
  })
})
