/**
 * @jest-environment jsdom
 */

import SettingsProfileTab from './SettingsProfileTab'
import { render, screen, waitFor } from '@testing-library/react'

describe('SettingsProfileTab', () => {
  const user = {
    id: 'test user',
    roles: ['user'],
  }

  it('renders an SettingsProfileTab component', async () => {
    render(<SettingsProfileTab user={user} />)

    await waitFor(async () => {
      expect(await screen.findByText('test user')).not.toBeUndefined()
      expect(await screen.findByText('Regenerate Token')).not.toBeUndefined()
      expect(await screen.findByText('User authentication token')).not.toBeUndefined()
    })
  })
})
