/**
 * @jest-environment jsdom
 */

import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import ModelOverview from './ModelOverview'
import { lightTheme } from './theme'
import { EntityKind } from '../types/interfaces'

describe('ModelOverview', () => {
  const version: any = {
    metadata: {
      highLevelDetails: {
        name: 'test model',
        modelOverview: 'test',
        tags: ['tag1'],
      },
      contacts: {
        uploader: [{ kind: EntityKind.USER, id: 'user1' }],
        reviewer: [{ kind: EntityKind.USER, id: 'user2' }],
        manager: [{ kind: EntityKind.USER, id: 'user3' }],
      },
    },
  }

  it('renders a ModelOverview component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <ModelOverview version={version} />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('test model')).not.toBeUndefined()
      expect(await screen.findByText('user1')).not.toBeUndefined()
      expect(await screen.findByText('user2')).not.toBeUndefined()
      expect(await screen.findByText('user3')).not.toBeUndefined()
    })
  })
})
