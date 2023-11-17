import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import UserAvatar from './UserAvatar'

describe('UserAvatar', () => {
  it('renders an UserAvatar component', async () => {
    render(<UserAvatar entityDn={'Zebra'} />)

    await waitFor(async () => {
      expect(await screen.findByText('Z')).not.toBeUndefined()
    })
  })
})
