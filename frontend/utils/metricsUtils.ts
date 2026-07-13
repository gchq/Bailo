import { mangoFusionPaletteDark } from '@mui/x-charts'
import { SchemaInterface } from 'types/types'

export const breakdownQueryTypes = ['byState', 'bySchema', 'totalEntries', 'withReleases', 'withAccessRequest'] as const
export type BreakdownQueryType = (typeof breakdownQueryTypes)[number]

type ModelBreakdownRequest = {
  organisation: string
  state?: string
  schemaId?: string
  release?: string
  accessRequest?: string
}

export type EntriesFilterQuery = {
  organisation?: string
  state?: string
  schemaId?: string
  release?: string
  accessRequest?: string
}

type BreakdownContext = {
  organisation: string
  schemas: SchemaInterface[]
}

// type BreakdownDefinition = {
//   buildQuery: (value: string, context: BreakdownContext) => ModelBreakdownRequest
// }

function resolveSchemaId(schemaName: string, schemas: SchemaInterface[]): string {
  return schemas.find((schema) => schema.name === schemaName)?.id ?? 'none'
}

function buildByStateQuery(state: string, context: BreakdownContext): ModelBreakdownRequest {
  return {
    organisation: context.organisation,
    state,
  }
}

function buildBySchemaQuery(schemaName: string, context: BreakdownContext): ModelBreakdownRequest {
  return {
    organisation: context.organisation,
    schemaId: resolveSchemaId(schemaName, context.schemas),
  }
}

function buildTotalEntriesQuery(context: BreakdownContext): ModelBreakdownRequest {
  return {
    organisation: context.organisation,
  }
}

function buildWithReleasesQuery(release: string, context: BreakdownContext): ModelBreakdownRequest {
  return {
    organisation: context.organisation,
    release,
  }
}

function buildWithAccessRequestQuery(accessRequest: string, context: BreakdownContext): ModelBreakdownRequest {
  return {
    organisation: context.organisation,
    accessRequest,
  }
}

function buildBreakdownQuery(
  type: BreakdownQueryType,
  value: string,
  context: BreakdownContext,
): ModelBreakdownRequest {
  switch (type) {
    case 'byState':
      return buildByStateQuery(value, context)
    case 'bySchema':
      return buildBySchemaQuery(value, context)
    case 'totalEntries':
      return buildTotalEntriesQuery(context)
    case 'withReleases':
      return buildWithReleasesQuery(value, context)
    case 'withAccessRequest':
      return buildWithAccessRequestQuery(value, context)
    default: {
      const exhaustiveCheck: never = type
      throw new Error(`Unhandled breakdown type: ${exhaustiveCheck}`)
    }
  }
}

// const breakdownDefinitions: Record<BreakdownQueryType, BreakdownDefinition> = {
//   byState: {
//     buildQuery: (value, context) => ({
//       organisation: context.organisation,
//       state: value,
//     }),
//   },
//   bySchema: {
//     buildQuery: (value, context) => ({
//       organisation: context.organisation,
//       schemaId: resolveSchemaId(value, context.schemas),
//     }),
//   },
//   // These three ignore `value` as they're triggered by a stat panel
//   totalEntries: {
//     buildQuery: (_value, context) => ({
//       organisation: context.organisation,
//     }),
//   },
//   withReleases: {
//     buildQuery: (_value, context) => ({
//       organisation: context.organisation,
//       withReleases: true,
//     }),
//   },
//   withAccessRequest: {
//     buildQuery: (_value, context) => ({
//       organisation: context.organisation,
//       withAccessRequest: true,
//     }),
//   },
// }

/**
 * Builds an Entries tab URL from a set of filters, omitting anything unset
 * or equal to 'All' so the URL stays clean and shareable.
 */
// export function buildEntriesHref(filters: EntriesFilterQuery): string {
//   const params = new URLSearchParams()
//   if (filters.organisation && filters.organisation !== 'All') {
//     params.set('organisation', filters.organisation)
//   }
//   if (filters.state) {
//     params.set('state', filters.state)
//   }
//   if (filters.schemaId) {
//     params.set('schemaId', filters.schemaId)
//   }
//   const queryString = params.toString()
//   return `/metrics?tab=entries${queryString ? `&${queryString}` : ''}`
// }
export function buildEntriesHref(filters: EntriesFilterQuery): string {
  const params = new URLSearchParams()
  if (filters.organisation && filters.organisation !== 'All') {
    params.set('organisation', filters.organisation)
  }
  if (filters.state) {
    params.set('state', filters.state)
  }
  if (filters.schemaId) {
    params.set('schemaId', filters.schemaId)
  }
  if (filters.release) {
    params.set('release', filters.release)
  }
  if (filters.accessRequest) {
    params.set('accessRequest', filters.accessRequest)
  }
  const queryString = params.toString()
  return `/metrics?tab=entries${queryString ? `&${queryString}` : ''}`
}

/**
 * Builds a deep link to the Entries tab pre-filtered based on a chart selection,
 * reusing the same buildQuery logic as the (now removed) inline breakdown panel.
 */
// export function buildEntriesTabHref(type: BreakdownQueryType, value: string, context: BreakdownContext): string {
//   const request = breakdownDefinitions[type].buildQuery(value, context)
//   return buildEntriesHref({
//     organisation: request.organisation,
//     state: request.state,
//     schemaId: request.schemaId,
//   })
// }
// export function buildEntriesTabHref(type: BreakdownQueryType, value: string, context: BreakdownContext): string {
//   const request = breakdownDefinitions[type].buildQuery(value, context)
//   return buildEntriesHref({
//     organisation: request.organisation,
//     state: request.state,
//     schemaId: request.schemaId,
//     withReleases: request.withReleases,
//     withAccessRequest: request.withAccessRequest,
//   })
// }

/**
 * Builds a deep link to the Entries tab pre-filtered based on a chart or
 * stat-panel selection on the Overview page.
 */
export function buildEntriesTabHref(type: BreakdownQueryType, value: string, context: BreakdownContext): string {
  const request = buildBreakdownQuery(type, value, context)
  return buildEntriesHref({
    organisation: request.organisation,
    state: request.state,
    schemaId: request.schemaId,
    release: request.release,
    accessRequest: request.accessRequest,
  })
}

export interface PieChartData {
  label: string
  value: number
  color?: string
}

// Ensure the colour used for 'none' values is consistent across charts
export const NONE_COLOR = mangoFusionPaletteDark[0]

// Remaining palette, used for everything else
export const remainingPalette = mangoFusionPaletteDark.filter((colour) => colour !== NONE_COLOR)

/**
 * Maps each pie data item to a colour, pinning 'none' to a
 * fixed palette colour and cycling the rest without repeats.
 */
export function withConsistentColours<T extends PieChartData>(items: T[]): (T & { color: string })[] {
  let i = 0
  return items.map((item) => {
    if (item.label.toLowerCase() === 'none') {
      return { ...item, color: NONE_COLOR }
    }
    const color = remainingPalette[i % remainingPalette.length]
    i += 1
    return { ...item, color }
  })
}
