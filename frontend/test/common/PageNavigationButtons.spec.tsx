import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PageNavigationButtons from '../../src/common/PageNavigationButtons'

describe('EmptyBlob', () => {
  it('displays a disabled next page button when current index is the same value as max pages', async () => {
    render(
      <PageNavigationButtons
        maxPages={2}
        currentIndex={2}
        navigateBackward={() => undefined}
        navigateForward={() => undefined}
      />,
    )
    const nextPageButton = screen.getByTestId('nextPageButton')
    await waitFor(async () => {
      expect(nextPageButton.hasAttribute('disabled')).toBe(true)
    })
  })

  it('displays a disabled previous page button when current index is 1', async () => {
    render(
      <PageNavigationButtons
        maxPages={2}
        currentIndex={1}
        navigateBackward={() => undefined}
        navigateForward={() => undefined}
      />,
    )
    const previousPageButton = screen.getByTestId('previousPageButton')
    await waitFor(async () => {
      expect(previousPageButton.hasAttribute('disabled')).toBe(true)
    })
  })

  it('next page button can be pressed when current index is below max page', async () => {
    const handleClickSpy = vi.fn()
    render(
      <PageNavigationButtons
        maxPages={2}
        currentIndex={1}
        navigateBackward={() => undefined}
        navigateForward={handleClickSpy}
      />,
    )
    const nextPageButton = screen.getByTestId('nextPageButton')
    fireEvent.click(nextPageButton)
    await waitFor(async () => {
      expect(handleClickSpy).toHaveBeenCalledOnce()
    })
  })

  it('next page button cannot be pressed when current index is the same as the max page count', async () => {
    const handleClickSpy = vi.fn()
    render(
      <PageNavigationButtons
        maxPages={2}
        currentIndex={2}
        navigateBackward={() => undefined}
        navigateForward={handleClickSpy}
      />,
    )
    const nextPageButton = screen.getByTestId('nextPageButton')
    fireEvent.click(nextPageButton)
    await waitFor(async () => {
      expect(handleClickSpy).not.toHaveBeenCalledOnce()
    })
  })
})
