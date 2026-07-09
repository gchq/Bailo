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

// test('getFormStats should calculate stats for a fully completed mixed form', () => {
//   const step = {
//     ...stepExample,
//     schema: {
//       definitions: {
//         infoRequirement: {
//           type: 'string',
//           enum: ['DOG', 'CAT'],
//         },
//         entity: {
//           type: 'string',
//           description:
//             "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
//         },
//       },
//       title: 'Business Case',
//       description: 'The business case section is designed for a non-technical customer of a mcdonaldsel to understand.',
//       type: 'object',
//       properties: {
//         need: {
//           title: 'Need for creating the mcdonaldsel',
//           description: 'Detailed description.',
//           type: 'string',
//           maxLength: 10000,
//         },
//         function: {
//           title: 'Applicable statutory function',
//           type: 'array',
//           widget: 'multiSelector',
//           items: {
//             type: 'string',
//             enum: ['SHOE', 'HAT', 'SOCK', 'Not applicable'],
//           },
//           uniqueItems: true,
//         },
//         extraInfo: {
//           title: 'Extra Information',
//           description: 'List extra information',
//           type: 'string',
//           maxLength: 10000,
//         },
//       },
//       additionalProperties: false,
//     },
//     state: {
//       need: 'It is needed',
//       function: ['SHOE'],
//       extraInfo: 'Because we need it now',
//     },
//   }
//   const stats = getFormStats(step)
//   expect(stats.totalQuestions).toBe(2)
//   expect(stats.totalAnswers).toBe(3)
//   expect(stats.percentageQuestionsComplete).toBe(100)
//   expect(stats.formCompleted).toBe(true)
// })
