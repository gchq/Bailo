import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ExpandableTypography from '../../src/common/ExpandableTypography'

describe('ExpandableTypography', () => {
  const text = 'Text that can wrap over several lines depending on the available width.'
  let clientHeight = 40
  let scrollHeight = 40

  const setOverflowing = (overflows: boolean) => {
    scrollHeight = overflows ? clientHeight + 20 : clientHeight
  }

  const renderTypography = (maxLines?: number) => {
    render(<ExpandableTypography maxLines={maxLines}>{text}</ExpandableTypography>)
    return screen.getByText(text)
  }

  beforeEach(() => {
    clientHeight = 40
    scrollHeight = 40
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => clientHeight)
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => scrollHeight)
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          return undefined
        }

        disconnect() {
          return undefined
        }
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('does not show the expansion control when the text fits', () => {
    const typography = renderTypography()

    expect(typography).toBeDefined()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('clamps overflowing text and shows the expansion control', () => {
    setOverflowing(true)

    const styles = getComputedStyle(renderTypography(2))

    expect(styles.display).toBe('-webkit-box')
    expect(styles.overflow).toBe('hidden')
    expect(styles.getPropertyValue('-webkit-box-orient')).toBe('vertical')
    expect(styles.webkitLineClamp).toBe('2')
    expect(screen.getByRole('button', { name: 'Show more' })).toBeDefined()
  })

  it('removes the clamp when expanded and restores it when collapsed', async () => {
    setOverflowing(true)
    const user = userEvent.setup()
    const typography = renderTypography()

    await user.click(screen.getByRole('button', { name: 'Show more' }))

    expect(getComputedStyle(typography).webkitLineClamp).toBe('')
    expect(screen.getByRole('button', { name: 'Show less' })).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Show less' }))
    expect(getComputedStyle(typography).webkitLineClamp).toBe('3')
  })

  it('updates the expansion control when the window size changes', () => {
    renderTypography()
    expect(screen.queryByRole('button')).toBeNull()

    setOverflowing(true)
    fireEvent(window, new Event('resize'))
    expect(screen.getByRole('button', { name: 'Show more' })).toBeDefined()

    setOverflowing(false)
    fireEvent(window, new Event('resize'))
    expect(screen.queryByRole('button')).toBeNull()
  })
})
