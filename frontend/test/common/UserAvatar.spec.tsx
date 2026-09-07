import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import UserAvatar from '../../src/common/UserAvatar'
import { EntityKind } from '../../types/types'

describe('UserAvatar', () => {
  it(`displays an avatar with user's initial`, async () => {
    render(<UserAvatar entity={{ kind: EntityKind.USER, id: 'Zebra' }} />)

    await waitFor(async () => {
      expect(await screen.findByTestId('userAvatar')).toBeDefined()
      expect(await screen.findByText('Z')).toBeDefined()
    })
  })
})
