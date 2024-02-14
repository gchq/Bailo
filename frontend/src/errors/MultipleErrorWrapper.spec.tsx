import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { WrapperProps } from 'src/Wrapper'
import { describe, expect, it, vi } from 'vitest'

import MultipleErrorWrapper from './MultipleErrorWrapper'

vi.mock('src/Wrapper.tsx', () => ({
  default: ({ children, ..._other }: WrapperProps) => <>{children}</>,
}))

describe('MultipleErrorWrapper', () => {
  const error1 = {}
  const error2 = {}

  const errorWrapper = MultipleErrorWrapper(`There was an error!`, {
    error1,
    error2,
  })

  it('renders an MultipleErrorWrapper component', async () => {
    mockRouter.push('/')
    if (errorWrapper) {
      render(errorWrapper)
    }

    await waitFor(async () => {
      expect(await screen.findByText('There was an error!')).not.toBeUndefined()
    })
  })
})
