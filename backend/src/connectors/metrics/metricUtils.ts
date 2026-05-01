import { PipelineStage } from 'mongoose'

import { ModelVolumeInterval } from '../../routes/v3/metrics/getModelVolume.js'

/**
 * Returns a new Date incremented by one interval
 * (day/week/month/quarter/year) in UTC.
 */
export function addInterval(date: Date, interval: ModelVolumeInterval): Date {
  const d = new Date(date)

  switch (interval) {
    case 'day':
      d.setUTCDate(d.getUTCDate() + 1)
      break
    case 'week':
      d.setUTCDate(d.getUTCDate() + 7)
      break
    case 'month':
      d.setUTCMonth(d.getUTCMonth() + 1)
      break
    case 'quarter':
      d.setUTCMonth(d.getUTCMonth() + 3)
      break
    case 'year':
      d.setUTCFullYear(d.getUTCFullYear() + 1)
      break
  }

  return d
}

export type ModelFilter = {
  organisation?: string
}

export function buildModelMatchStage(filter: ModelFilter): PipelineStage.Match {
  const match: Record<string, unknown> = {}

  // Only undefined means "no organisation filter"
  if (filter.organisation !== undefined) {
    match.organisation = filter.organisation
  }

  return { $match: match }
}

export type SchemaRoleMap = {
  schemaRoleMap: Record<string, string[]>
  defaultRoles: string[]
  roleMeta: Record<string, { roleId: string; roleName: string }>
}
