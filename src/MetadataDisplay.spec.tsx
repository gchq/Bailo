/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import * as schemaService from '../data/schema'
import MetadataDisplay from './MetadataDisplay'
import { lightTheme } from './theme'

describe('MetadataDisplay', () => {
  it('renders a MetadataDisplay component', async () => {
    const item: any = {
      schemaRef: 'test-schema',
      question: 'This is a test answer',
      timeStamp: new Date(),
    }

    const mockedSchema: any = {
      schemas: [
        {
          name: 'upload-schema',
          reference: 'test-schema',
          use: 'UPLOAD',
          schema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                title: 'This is a test question',
              },
            },
          },
        },
      ],
      isSchemasLoading: false,
      isSchemasError: false,
    }

    const mockedSchemaService = jest.spyOn(schemaService, 'useGetSchemas')
    mockedSchemaService.mockReturnValue(mockedSchema)

    render(
      <ThemeProvider theme={lightTheme}>
        <MetadataDisplay item={item} tabsDisplaySequentially use='UPLOAD' />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('This is a test answer')).not.toBeUndefined()
      expect(await screen.findAllByText('This is a test question')).not.toBeUndefined()
    })
  })
})
