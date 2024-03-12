import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { WrapperProps } from 'src/Wrapper'
import { describe, expect, it, vi } from 'vitest'

import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'

vi.mock('src/Wrapper.tsx', () => ({
  default: ({ children, ..._other }: WrapperProps) => <>{children}</>,
}))

const noError = undefined
const error1 = {}
const error2 = {}

describe('MultipleErrorWrapper', () => {
  it('does not display an error message when no errors are present', async () => {
    mockRouter.push('/')

    const errorWrapper = MultipleErrorWrapper('Test error message', {
      noError,
    })

    if (errorWrapper) {
      render(errorWrapper)
    }

    await waitFor(async () => {
      expect(screen.queryByText('Test error message')).toBeNull()
    })
  })

  it('displays an error message when one error is present', async () => {
    mockRouter.push('/')

    const errorWrapper = MultipleErrorWrapper('Test error message', {
      error1,
      noError,
    })

    if (errorWrapper) {
      render(errorWrapper)
    }

    await waitFor(async () => {
      expect(await screen.findByText('Test error message')).toBeDefined()
    })
  })

  it('displays an error message when multiple errors are present', async () => {
    mockRouter.push('/')

    const errorWrapper = MultipleErrorWrapper('Test error message', {
      error1,
      error2,
    })

    if (errorWrapper) {
      render(errorWrapper)
    }

    await waitFor(async () => {
      expect(await screen.findByText('Test error message')).toBeDefined()
    })
  })
})
