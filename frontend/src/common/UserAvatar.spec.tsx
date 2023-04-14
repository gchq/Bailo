/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { EntityKind } from '../../../lib/shared/types'
import UserAvatar from './UserAvatar'

describe('UserAvatar', () => {
  it('renders an UserAvatar component', async () => {
    render(<UserAvatar entity={{ kind: EntityKind.USER, id: 'Zebra' }} />)

    await waitFor(async () => {
      expect(await screen.findByText('Z')).not.toBeUndefined()
    })
  })
})
