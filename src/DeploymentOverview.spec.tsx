/**
 * @jest-environment jsdom
 */

import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { DeploymentDoc } from '../server/models/Deployment'
import DeploymentOverview from './DeploymentOverview'
import { lightTheme } from './theme'
import { EntityKind } from '../types/interfaces'

describe('DeploymentOverview', () => {
  const deployment = {
    metadata: {
      highLevelDetails: {
        name: 'test',
      },
      contacts: {
        owner: [
          { kind: EntityKind.USER, id: 'user1' },
          { kind: EntityKind.USER, id: 'user2' },
        ],
      },
    },
  }

  it('renders a DeploymentOverview component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <DeploymentOverview deployment={deployment as DeploymentDoc} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Owner')).not.toBeUndefined()
      expect(await screen.findByText('user1, user2')).not.toBeUndefined()
    })
  })
})
