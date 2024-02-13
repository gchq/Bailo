import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { beforeAll, describe, expect, it } from 'vitest'

import ErrorWrapper from './ErrorWrapper'

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
