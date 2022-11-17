/**
 * @jest-environment jsdom
 */

import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { lightTheme } from '../theme'
import SettingsProfileTab from './SettingsProfileTab'

describe('SettingsProfileTab', () => {
  const user = {
    id: 'test user',
    roles: ['user'],
  }

  it('renders an SettingsProfileTab component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SettingsProfileTab user={user} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('test user')).not.toBeUndefined()
      expect(await screen.findByText('Regenerate Token')).not.toBeUndefined()
      expect(await screen.findByText('User authentication token')).not.toBeUndefined()
    })
  })
})
