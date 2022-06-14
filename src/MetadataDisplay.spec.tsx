/**
 * @jest-environment jsdom
 */

import MetadataDisplay from './MetadataDisplay'
import { render, screen, waitFor } from '@testing-library/react'
import * as schemaService from '../data/schema'

describe('MetadataDisplay', () => {

  it('renders a MetadataDisplay component', async () => { 

    const item: any = {
    versions: [],
    schemaRef: 'test-schema',
    uuid: 'test-model',
    metadata: {
      question: 'This is a test answer'
    },
    owner: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    }

    const mockedSchema: any = {
      schemas: [
        {
          name: 'upload-schema',
          reference: 'test-schema',
          use: 'UPLOAD',
          schema: {
            "type": "object",
            "properties": {
              "question": {
                "type": "string",
                "title": "This is a test question",
              }
            }
          }
        }
      ],
      isSchemasLoading: false,
      isSchemasError: false
    }

    const mockedSchemaService = jest.spyOn(schemaService, 'useGetSchemas')
    mockedSchemaService.mockReturnValue(mockedSchema)

    render(
      <MetadataDisplay item={item} tabsDisplaySequentially use='UPLOAD' />
  )

    await waitFor(async () => {
      screen.debug()
      expect(await screen.findByText('test data')).not.toBeUndefined()
    })
  })

})