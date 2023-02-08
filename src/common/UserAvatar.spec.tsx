/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import UserAvatar from './UserAvatar.js'
import { EntityKind } from '../../types/interfaces.js'

describe('UserAvatar', () => {
  it('renders an UserAvatar component', async () => {
    render(<UserAvatar entity={{ kind: EntityKind.USER, id: 'Zebra' }} />)

    await waitFor(async () => {
      expect(await screen.findByText('Z')).not.toBeUndefined()
    })
  })
})
