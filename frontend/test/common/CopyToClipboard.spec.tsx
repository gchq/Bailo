import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import CopyToClipboardButton from '../../src/common/CopyToClipboardButton'

describe('CopyToClipboard', () => {
  const testText = 'This is some text'

  it('when the CopyToClipboard button component is clicked it should call the navigator.clipboard.writeText function', async () => {
    render(<CopyToClipboardButton textToCopy={testText} />)

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })

    const CopyButton = await screen.findByTestId('copyToClipboardButton')
    fireEvent.click(CopyButton)

    await waitFor(async () => {
      expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(testText)
    })
  })

  test('Shows the tooltip label when hovered over', async () => {
    const screenRender = render(<CopyToClipboardButton textToCopy={testText} />)

    const CopyButton = await screen.findByTestId('copyToClipboardButton')
    fireEvent.mouseOver(CopyButton)

    expect(await screenRender.findByText('Copy to clipboard')).toBeDefined()
  })
})
