/**
 * @jest-environment jsdom
 */

import TerminalLog from './TerminalLog'
import { render, screen, waitFor } from '@testing-library/react'

describe('TerminalLog', () => {
  const logs = ['test line 1', 'test line 2', 'test line 3']

  it('renders a TerminalLog component', async () => {
    const { container } = render(<TerminalLog logs={logs} title='Terminal log' />)

    await waitFor(async () => {
      expect(container.getElementsByClassName('react-terminal-line').length).toBe(3)
    })
  })
})
