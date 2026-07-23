import { SchemaInterface } from 'types/types'
import { buildEntriesTabHref, sortPieData, toPieData } from 'utils/metricsUtils'
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

describe('sortPieData', () => {
  it('moves "None" entries to the end of the array', () => {
    const data = [
      { label: 'None', value: 4 },
      { label: 'Development', value: 3 },
      { label: 'Review', value: 1 },
    ]

    const result = sortPieData(data)

    expect(result).toEqual([
      { label: 'Development', value: 3 },
      { label: 'Review', value: 1 },
      { label: 'None', value: 4 },
    ])
  })

  it('treats "None" case-insensitively and does not mutate the input array', () => {
    const data = [
      { label: 'Development', value: 3 },
      { label: 'nOnE', value: 4 },
      { label: 'Review', value: 1 },
    ]

    const result = sortPieData(data)

    expect(result).toEqual([
      { label: 'Development', value: 3 },
      { label: 'Review', value: 1 },
      { label: 'nOnE', value: 4 },
    ])

    // Verify the original array was not modified
    expect(data).toEqual([
      { label: 'Development', value: 3 },
      { label: 'nOnE', value: 4 },
      { label: 'Review', value: 1 },
    ])
  })
})

describe('toPieData', () => {
  it('maps items to pie chart data and applies the none colour to "none" entries', () => {
    const result = toPieData(
      [
        { label: 'Development', value: 3 },
        { label: 'None', value: 4 },
      ],
      '#999999',
    )

    expect(result).toEqual([
      {
        label: 'Development',
        value: 3,
        color: undefined,
      },
      {
        label: 'None',
        value: 4,
        color: '#999999',
      },
    ])
  })
})
