/**
 * @jest-environment jsdom
 */

import ModelOverview from './ModelOverview'
import { render, screen, waitFor } from '@testing-library/react'
import ThemeProvider from '@mui/system/ThemeProvider'
import { lightTheme } from './theme'

describe('ModelOverview', () => {
  const version: any = {
    metadata: {
      highLevelDetails: {
        name: 'test model',
        modelOverview: 'test',
        tags: ['tag1'],
      },
      contacts: {
        uploader: 'user1',
        reviewer: 'user2',
        manager: 'user3',
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
