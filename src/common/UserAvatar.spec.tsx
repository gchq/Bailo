/**
 * @jest-environment jsdom
 */

import UserAvatar from './UserAvatar'
import { render, screen, waitFor } from '@testing-library/react'

describe('UserAvatar', () => {
  it('renders an UserAvatar component', async () => {
    render(<UserAvatar username='Zebra' />)

    await waitFor(async () => {
      expect(await screen.findByText('Z')).not.toBeUndefined()
    })
  })
})
