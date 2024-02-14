import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { WrapperProps } from 'src/Wrapper'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import ErrorWrapper from './ErrorWrapper'

vi.mock('src/Wrapper.tsx', () => ({
  default: ({ children, ..._other }: WrapperProps) => <>{children}</>,
}))

describe('ErrorWrapper', () => {
  beforeAll(() => {
    mockRouter.push('/')
  })
  it('renders an ErrorWrapper component', async () => {
    render(<ErrorWrapper message='error!' />)

    await waitFor(async () => {
      expect(await screen.findByText('error!')).not.toBeUndefined()
    })
  })
})
