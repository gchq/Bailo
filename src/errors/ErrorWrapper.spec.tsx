/**
 * @jest-environment jsdom
 */

import ErrorWrapper, { MinimalErrorWrapper } from './ErrorWrapper'
import { render, screen, waitFor } from '@testing-library/react'

describe('ErrorWrapper', () => {
  it('renders an ErrorWrapper component', async () => {
    render(<ErrorWrapper message='error!' />)

    await waitFor(async () => {
      expect(await screen.findByText('error!')).not.toBeUndefined()
    })
  })

  it('renders a MinimalErrorWrapper component', async () => {
    render(<MinimalErrorWrapper message='error!' />)

    await waitFor(async () => {
      expect(await screen.findByText('error!')).not.toBeUndefined()
    })
  })
})
