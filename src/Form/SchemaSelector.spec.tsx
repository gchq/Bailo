/**
 * @jest-environment jsdom
 */

import SchemaSelector from './SchemaSelector'
import { render, screen, waitFor } from '@testing-library/react'

describe('SchemaSelector', () => {
  const schema: any = {
    name: 'Test Schema',
    user: 'UPLOAD',
    schemaRef: 'test-schema',
    question: {
      type: 'string',
      title: 'this is a question',
    },
  }

  const schemas: any = []
  schemas.push(schema)

  it('renders a SchemaSelector component', async () => {
    render(<SchemaSelector currentSchema={schema} schemas={schemas} setCurrentSchema={() => {}} />)

    await waitFor(async () => {
      expect(await screen.findByLabelText('Test Schema')).not.toBeUndefined()
    })
  })
})
