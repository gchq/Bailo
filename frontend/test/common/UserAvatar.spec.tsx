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

  it('names and outlines the avatar when it is highlighted', async () => {
    render(<UserAvatar entity={{ kind: EntityKind.USER, id: 'Zebra' }} highlight />)

    const avatar = await screen.findByLabelText('Zebra (you)')
    await waitFor(() => {
      expect(getComputedStyle(avatar).borderStyle).toBe('solid')
    })
  })

  it('does not name or outline the avatar by default', async () => {
    render(<UserAvatar entity={{ kind: EntityKind.USER, id: 'Zebra' }} />)

    await waitFor(async () => {
      expect(screen.queryByLabelText('Zebra (you)')).toBeNull()
      expect(getComputedStyle(await screen.findByTestId('userAvatar')).borderStyle).not.toBe('solid')
    })
  })
})
