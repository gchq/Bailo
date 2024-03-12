import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { WrapperProps } from 'src/Wrapper'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import ErrorWrapper from '../../src/errors/ErrorWrapper'

vi.mock('src/Wrapper.tsx', () => ({
  default: ({ children, ..._other }: WrapperProps) => <div data-test='errorWrapperWrapper'>{children}</div>,
}))

describe('ErrorWrapper', () => {
  beforeAll(() => {
    mockRouter.push('/')
  })
  it('displays an error message with wrapper when rendered', async () => {
    render(<ErrorWrapper message='Test' />)

    await waitFor(async () => {
      expect(await screen.findByTestId('errorWrapperWrapper')).toBeDefined()
      expect(await screen.findByTestId('errorWrapperMessage')).toBeDefined()
    })
  })
})
