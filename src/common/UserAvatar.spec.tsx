/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import UserAvatar from './UserAvatar'

describe('UserAvatar', () => {
  it('renders an UserAvatar component', async () => {
    render(<UserAvatar username='Zebra' />)

    await waitFor(async () => {
      expect(await screen.findByText('Z')).not.toBeUndefined()
    })
  })
})
