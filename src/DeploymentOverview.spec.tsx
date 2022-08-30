/**
 * @jest-environment jsdom
 */

import ThemeProvider from '@mui/system/ThemeProvider'
import { render, screen, waitFor } from '@testing-library/react'
import DeploymentOverview from './DeploymentOverview'
import { lightTheme } from './theme'

describe('DeploymentOverview', () => {
  const version = {
    metadata: {
      highLevelDetails: {
        name: 'test',
      },
      contacts: {
        requester: 'user1',
        secondPOC: 'user2',
      },
    },
  }

  it('renders a DeploymentOverview component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <DeploymentOverview version={version} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Owner')).not.toBeUndefined()
      expect(await screen.findByText('user1')).not.toBeUndefined()
      expect(await screen.findByText('Point of Contact')).not.toBeUndefined()
      expect(await screen.findByText('user2')).not.toBeUndefined()
    })
  })
})
