import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EntityKind } from '../../types/types'
import UserAvatar from './UserAvatar'

describe('UserAvatar', () => {
  it('renders an UserAvatar component', async () => {
    render(<UserAvatar entity={{ kind: EntityKind.USER, id: 'Zebra' }} />)

    await waitFor(async () => {
      expect(await screen.findByText('Z')).not.toBeUndefined()
    })
  })
})
