/**
 * @jest-environment jsdom
 */

import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import DeploymentOverview from './DeploymentOverview'
import { lightTheme } from './theme'
import { EntityKind, Deployment } from '../../lib/shared/types'

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
        <DeploymentOverview deployment={deployment as Deployment} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Owner')).not.toBeUndefined()
      expect(await screen.findByText('user1, user2')).not.toBeUndefined()
    })
  })
})
