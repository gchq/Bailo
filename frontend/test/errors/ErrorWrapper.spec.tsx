import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { beforeAll, describe, expect, it } from 'vitest'

import ErrorWrapper from '../../src/errors/ErrorWrapper'

describe('ErrorWrapper', () => {
  beforeAll(() => {
    mockRouter.push('/')
  })
  it('displays an error message when rendered', async () => {
    render(<ErrorWrapper message='Test' />)

    await waitFor(async () => {
      expect(await screen.findByTestId('errorWrapperMessage')).toBeDefined()
    })
  })
})
