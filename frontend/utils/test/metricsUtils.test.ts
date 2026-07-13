import { SchemaInterface } from 'types/types'
import { buildEntriesTabHref } from 'utils/metricsUtils'
import { expect } from 'vitest'

const mockSchemas = [
  { id: 'schema-1', name: 'Minimal Schema' },
  { id: 'schema-2', name: 'Full Schema' },
] as SchemaInterface[]

describe('buildEntriesTabHref', () => {
  it('builds a state-filtered href for the given organisation', () => {
    const href = buildEntriesTabHref('byState', 'Active', { organisation: 'mcdonalds', schemas: mockSchemas })

    expect(href).toBe('/metrics?tab=entries&organisation=mcdonalds&state=Active')
  })

  it('resolves a schema name to its id when building a schema-filtered href', () => {
    const href = buildEntriesTabHref('bySchema', 'Full Schema', { organisation: 'mcdonalds', schemas: mockSchemas })

    expect(href).toBe('/metrics?tab=entries&organisation=mcdonalds&schemaId=schema-2')
  })

  it('falls back to "none" when the schema name cannot be resolved', () => {
    const href = buildEntriesTabHref('bySchema', 'Unknown Schema', { organisation: 'mcdonalds', schemas: mockSchemas })

    expect(href).toBe('/metrics?tab=entries&organisation=mcdonalds&schemaId=none')
  })

  it('omits the organisation param entirely when it is "All"', () => {
    const href = buildEntriesTabHref('byState', 'Active', { organisation: 'All', schemas: mockSchemas })

    expect(href).toBe('/metrics?tab=entries&state=Active')
  })

  it('URL-encodes an organisation name containing spaces', () => {
    const href = buildEntriesTabHref('byState', 'Active', {
      organisation: 'Uncle Freds Robot Corporation',
      schemas: mockSchemas,
    })

    // URLSearchParams encodes spaces as '+' rather than '%20'
    expect(href).toBe('/metrics?tab=entries&organisation=Uncle+Freds+Robot+Corporation&state=Active')

    // Round-trip check: confirm the encoded value decodes back to the original string,
    // which is really the property we care about (not the '+' vs '%20' encoding detail itself)
    const parsedParams = new URLSearchParams(href.split('?')[1])
    expect(parsedParams.get('organisation')).toBe('Uncle Freds Robot Corporation')
  })
})
