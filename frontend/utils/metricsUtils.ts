import { PieChartData } from 'src/metrics/components/MetricsPieChart'
import { SchemaInterface } from 'types/types'

export const dateFormat = 'YYYY-MM'

export const filterSelectTypes = {
  ALL: 'All',
  NONE: 'none',
  UNSET: 'unset',
}

export const breakdownQueryTypes = ['byState', 'bySchema', 'totalEntries', 'withReleases', 'withAccessRequest'] as const
export type BreakdownQueryType = (typeof breakdownQueryTypes)[number]

export const filterIncludeTypes = {
  WITH: 'with',
  WITHOUT: 'without',
}

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
  startMonth?: string
  endMonth?: string
}

type BreakdownContext = {
  organisation: string
  schemas: SchemaInterface[]
}

function resolveSchemaId(schemaName: string, schemas: SchemaInterface[]): string {
  return schemas.find((schema) => schema.name === schemaName)?.id ?? 'none'
}

function buildBreakdownQuery(
  type: BreakdownQueryType,
  value: string,
  context: BreakdownContext,
): ModelBreakdownRequest {
  switch (type) {
    case 'byState':
      return {
        organisation: context.organisation,
        state: value,
      }
    case 'bySchema':
      return {
        organisation: context.organisation,
        schemaId: resolveSchemaId(value, context.schemas),
      }
    case 'totalEntries':
      return {
        organisation: context.organisation,
      }
    case 'withReleases':
      return {
        organisation: context.organisation,
        release: filterIncludeTypes.WITH,
      }
    case 'withAccessRequest':
      return {
        organisation: context.organisation,
        accessRequest: filterIncludeTypes.WITH,
      }
    default: {
      const exhaustiveCheck: never = type
      throw new Error(`Unhandled breakdown type: ${exhaustiveCheck}`)
    }
  }
}

/**
 * Constructs the URL with any optional query parameters provided.
 */
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
  if (filters.startMonth) {
    params.set('startMonth', filters.startMonth)
  }
  if (filters.endMonth) {
    params.set('endMonth', filters.endMonth)
  }
  const queryString = params.toString()
  return `/metrics?tab=entries${queryString ? `&${queryString}` : ''}`
}

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

/**
 * Sort the pie chart data to ensure the 'None' count is always last.
 */
export function sortPieData<T extends PieChartData>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aIsNone = a.label.toLowerCase() === 'none'
    const bIsNone = b.label.toLowerCase() === 'none'

    return Number(aIsNone) - Number(bIsNone)
  })
}

/**
 * Convert data into the format expected by the pie chart
 * utilising a specific colour for 'none' values.
 */
export function toPieData(items: { label: string; value: number }[], noneColour: string): PieChartData[] {
  return items.map(({ label, value }) => ({
    label,
    value,
    color: label.toLowerCase() === filterSelectTypes.NONE ? noneColour : undefined,
  }))
}
