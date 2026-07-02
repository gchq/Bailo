import { mangoFusionPaletteDark } from '@mui/x-charts'
import { SchemaInterface } from 'types/types'

export const breakdownQueryTypes = ['byState', 'bySchema'] as const
export type BreakdownQueryType = (typeof breakdownQueryTypes)[number]

export type BreakdownSelection = {
  type: BreakdownQueryType
  value: string
} | null

export type ModelBreakdownRequest = {
  organisation: string
  state?: string
  schemaId?: string
}

export type BreakdownContext = {
  organisation: string
  schemas: SchemaInterface[]
}

export type BreakdownDefinition = {
  buildQuery: (value: string, context: BreakdownContext) => ModelBreakdownRequest
  getTitle: (value: string) => string
  getErrorMessage: (value: string) => string
}

function resolveSchemaId(schemaName: string, schemas: SchemaInterface[]): string {
  return schemas.find((schema) => schema.name === schemaName)?.id ?? 'none'
}

export const breakdownDefinitions: Record<BreakdownQueryType, BreakdownDefinition> = {
  byState: {
    buildQuery: (value, context) => ({
      organisation: context.organisation,
      state: value,
    }),
    getTitle: (value) =>
      value.toLowerCase() === 'none' ? 'Models with no state selected' : `Models in state: ${value}`,
    getErrorMessage: (value) => `Failed to load models in state "${value}". Please try again.`,
  },
  bySchema: {
    buildQuery: (value, context) => ({
      organisation: context.organisation,
      schemaId: resolveSchemaId(value, context.schemas),
    }),
    getTitle: (value) =>
      value.toLowerCase() === 'none' ? 'Models with no schema selected' : `Models with schema: ${value}`,
    getErrorMessage: (value) => `Failed to load models with schema "${value}". Please try again.`,
  },
}

export interface PieChartData {
  label: string
  value: number
  color?: string
}

// Ensure the colour used for 'none' values is consistent across charts
export const NONE_COLOR = mangoFusionPaletteDark[0]

// Remaining palette, used for everything else
export const remainingPalette = mangoFusionPaletteDark.filter((c) => c !== NONE_COLOR)

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
