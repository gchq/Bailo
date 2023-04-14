import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SchemaSelector from './SchemaSelector'

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
    const doNothing = () => {
      /* do nothing */
    }
    render(<SchemaSelector currentSchema={schema} schemas={schemas} setCurrentSchema={doNothing} />)

    await waitFor(async () => {
      expect(await screen.findByText('Test Schema')).not.toBeUndefined()
    })
  })
})
