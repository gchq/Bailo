import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetSchema } from '../data/schema'
import { EntityKind } from '../types/types'
import ModelOverview from './ModelOverview'
import { lightTheme } from './theme'

vi.mock('../data/schema', async () => {
  const actual = await vi.importActual('../data/schema')
  return {
    ...(actual as any),
    useGetSchema: vi.fn(),
  }
})

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
    const mockedSchema: any = {
      schema: {
        name: 'upload-schema',
        reference: 'test-schema',
        use: 'UPLOAD',
        schema: {
          type: 'object',
          properties: {
            contacts: {
              title: 'Contacts',
              type: 'object',
              properties: {
                uploader: {
                  title: 'Model Developer',
                },
                reviewer: {
                  title: 'Model Technical Reviewer',
                },
                manager: {
                  title: 'Senior Responsible Officer',
                },
              },
            },
          },
        },
      },

      isSchemaLoading: false,
      isSchemaError: false,
    }

    vi.mocked(useGetSchema).mockReturnValue(mockedSchema)

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
