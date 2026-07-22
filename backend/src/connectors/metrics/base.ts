import { Model, PipelineStage, QueryFilter } from 'mongoose'
import NodeCache from 'node-cache'

import { Roles } from '../../connectors/authentication/constants.js'
import authentication from '../../connectors/authentication/index.js'
import AccessRequestModel from '../../models/AccessRequest.js'
import ModelModel, { EntryKind, ModelInterface, SystemRoles } from '../../models/Model.js'
import ReleaseModel from '../../models/Release.js'
import ReviewRoleModel from '../../models/ReviewRole.js'
import SchemaModel from '../../models/Schema.js'
import { UserInterface } from '../../models/User.js'
import {
  EntryVolumeDataPoint,
  EntryVolumeInterval,
  GetEntryVolumeResponse,
} from '../../routes/v3/metrics/getEntryVolume.js'
import { GetModelBreakdownResponse } from '../../routes/v3/metrics/getModelBreakdown.js'
import { GetNoReleasesComplianceMetricsResponse } from '../../routes/v3/metrics/getNoReleasesComplianceMetrics.js'
import { GetRoleComplianceMetricsResponse } from '../../routes/v3/metrics/getRoleComplianceMetrics.js'
import { BaseMetrics, GetUsageMetricsResponse, SchemaInfo, StateInfo } from '../../routes/v3/metrics/getUsageMetrics.js'
import { MetricsCacheKeys } from '../../types/enums.js'
import { EntryFilter, MetricsEntrySearchOptionsParams } from '../../types/types.js'
import { BadReq, Forbidden } from '../../utils/error.js'
import { isMongoServerError } from '../../utils/mongo.js'
import {
  addInterval,
  buildModelMatchStage,
  getActiveRoleSet,
  getApplicableRoleSet,
  ModelFilter,
  SchemaRoleMap,
} from './metricUtils.js'

const METRICS_CACHE_TTL = 5 * 60 // 5 minutes
const MODELS_KIND_FILTER = { kind: { $in: [EntryKind.Model, EntryKind.MirroredModel, EntryKind.UntrustedModel] } }

const metricsCache = new NodeCache({
  stdTTL: METRICS_CACHE_TTL,
  checkperiod: METRICS_CACHE_TTL,
  useClones: false,
})

type CachedMetrics<MetricsCache> = {
  data: MetricsCache
  lastUpdated: string
}

function getCached<T>(key: string): T | undefined {
  return metricsCache.get<T>(key)
}

function setCached<T>(key: string, value: T): void {
  metricsCache.set(key, value)
}

async function checkUserIsAuthorised(user: UserInterface) {
  if (!(await authentication.hasRole(user, Roles.Compliance))) {
    throw Forbidden('You do not have the required role.', {
      userDn: user.dn,
      requiredRole: Roles.Compliance,
    })
  }
}

/**
 * Creates aggregation stages to join a related collection with the models
 * collection and filter by organisation.
 *
 * Used when counting models referenced by other collections (e.g. releases
 * or access requests).
 */
function buildOrganisationLookupStages(org: string): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'v2_models',
        localField: 'modelId',
        foreignField: 'id',
        as: 'model',
      },
    },
    { $unwind: '$model' },
    { $match: { 'model.organisation': org } },
  ]
}

/**
 * Counts the number of unique collaborator entities across all models.
 */
async function calculateTotalUsers(): Promise<number> {
  const pipeline: PipelineStage[] = [
    { $unwind: '$collaborators' },
    { $group: { _id: '$collaborators.entity' } },
    { $count: 'count' },
  ]

  const result = await ModelModel.aggregate(pipeline)

  return result[0]?.count ?? 0
}

/**
 * Counts the total number of entries matching the provided filter.
 */
async function calculateTotalEntries(filter: ModelFilter): Promise<number> {
  return ModelModel.countDocuments(filter)
}

/**
 * Counts distinct entries referenced in another collection
 * (e.g. releases or access requests).
 *
 * If an organisation filter is provided, a lookup is performed to ensure
 * only models belonging to that organisation are counted.
 */
async function countDistinctEntriesWithRelation(collection: Model<any>, filter: ModelFilter): Promise<number> {
  if (filter.organisation === undefined) {
    const ids = await collection.distinct('modelId')
    return ids.length
  }

  const pipeline: PipelineStage[] = [
    ...buildOrganisationLookupStages(filter.organisation),
    { $group: { _id: '$modelId' } },
    { $count: 'count' },
  ]

  const result = await collection.aggregate(pipeline)
  return result[0]?.count ?? 0
}

/**
 * Returns the number of entries grouped by lifecycle state.
 */
async function calculateEntriesByState(filter: ModelFilter): Promise<StateInfo[]> {
  const pipeline: PipelineStage[] = [
    buildModelMatchStage(filter),
    { $group: { _id: '$state', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]

  const entriesByState = await ModelModel.aggregate(pipeline)

  return entriesByState.map((row) => ({
    state: row._id && row._id.trim() !== '' ? row._id : 'None',
    count: row.count,
  }))
}

/**
 * Calculates how many entries use each schema.
 */
async function calculateSchemaBreakdown(filter: ModelFilter): Promise<SchemaInfo[]> {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        hidden: false,
      },
    },
    // Lookup entries that reference this schema
    {
      $lookup: {
        from: 'v2_models',
        let: { schemaId: '$id' },
        pipeline: [
          {
            // Match entries whose card.schemaId equals this schema's id
            $match: {
              $expr: { $eq: ['$card.schemaId', '$$schemaId'] },
              ...(filter.organisation !== undefined && {
                organisation: filter.organisation,
              }),
            },
          },
          {
            $count: 'count',
          },
        ],
        as: 'modelUsage',
      },
    },
    // Extract the count value from the lookup result.
    {
      $addFields: {
        count: {
          $ifNull: [{ $arrayElemAt: ['$modelUsage.count', 0] }, 0],
        },
      },
    },
    {
      $project: {
        schemaId: '$_id',
        schemaName: '$name',
        count: 1,
        _id: 0,
      },
    },
  ]

  return SchemaModel.aggregate<SchemaInfo>(pipeline)
}

/**
 * Calculates the full set of usage metrics either globally
 * or scoped to a specific organisation.
 */
async function calculateUsageMetrics(user: UserInterface, filter: ModelFilter): Promise<BaseMetrics> {
  await checkUserIsAuthorised(user)
  const [totalEntries, stateMetrics, schemaMetrics, totalEntriesWithReleases, totalEntriesWithAccessRequests] =
    await Promise.all([
      calculateTotalEntries(filter),
      calculateEntriesByState(filter),
      calculateSchemaBreakdown(filter),
      countDistinctEntriesWithRelation(ReleaseModel, filter),
      countDistinctEntriesWithRelation(AccessRequestModel, filter),
    ])

  // Sum entries counted in schemas
  const schemaTotal = schemaMetrics.reduce((sum, s) => sum + s.count, 0)

  // Entries with no schema
  const noneCount = Math.max(totalEntries - schemaTotal, 0)

  const schemaBreakdown: SchemaInfo[] = [
    ...schemaMetrics,
    {
      schemaId: 'none',
      schemaName: 'None',
      count: noneCount,
    },
  ]

  return {
    users: undefined,
    entries: totalEntries,
    schemaBreakdown,
    entryState: stateMetrics,
    withReleases: totalEntriesWithReleases,
    withAccessRequest: totalEntriesWithAccessRequests,
  }
}

/**
 * Builds a lookup structure describing which review roles apply to which schemas.
 */
export async function buildSchemaRoleMap(): Promise<SchemaRoleMap> {
  const schemas = await SchemaModel.find({
    active: true,
    hidden: false,
  })
    .select('id reviewRoles')
    .lean()

  // Fetch review roles
  const reviewRoles = await ReviewRoleModel.find().select('shortName name systemRole').lean()

  // Build schemaId -> roles mapping
  const schemaRoleMap: Record<string, string[]> = {}

  for (const schema of schemas) {
    schemaRoleMap[schema.id] = schema.reviewRoles ?? []
  }

  const roleMeta: Record<string, { roleId: string; roleName: string }> = {}

  for (const role of reviewRoles) {
    roleMeta[role.shortName] = {
      roleId: role.shortName,
      roleName: role.name,
    }
  }

  return {
    schemaRoleMap,
    roleMeta,
  }
}

type RoleComplianceMetricsResult = {
  summary: {
    roleId: string
    roleName: string
    count: number
  }[]
  entries: {
    entryId: string
    missingRoles: {
      roleId: string
      roleName: string
    }[]
    modelOwners: string[]
  }[]
}

type ModelWithNoReleases = {
  entryId: string
  organisation: string
  modelOwners: string[]
}

type NoReleasesComplianceMetricsResultSubset = {
  summary: {
    modelsWithNoReleases: number
  }
  entries: ModelWithNoReleases[]
}

type NoReleasesComplianceMetricsResultByOrgSubset = {
  organisation: string
} & NoReleasesComplianceMetricsResultSubset

type NoReleasesComplianceMetricsResult = {
  global: NoReleasesComplianceMetricsResultSubset
  byOrganisation: NoReleasesComplianceMetricsResultByOrgSubset[]
}

/**
 * Calculates which entries are missing required review roles, either globally
 * or scoped to a specific organisation.
 */
async function calculateMissingEntryRoles(
  schemaRoleMap: Record<string, string[]>,
  roleMeta: Record<string, { roleId: string; roleName: string }>,
  org?: string,
): Promise<RoleComplianceMetricsResult> {
  const filter: ModelFilter = {}

  // Only undefined means global
  if (org !== undefined) {
    filter.organisation = org
  }

  // Gets models by the specified organisation | no organisation
  const models = ModelModel.find(filter).select('id organisation card collaborators').lean().cursor()

  const entriesResult: RoleComplianceMetricsResult['entries'] = []

  // Build set of all known roles
  const allKnownRoles = new Set<string>([])
  Object.values(schemaRoleMap).forEach((roles) => {
    roles.forEach((role) => allKnownRoles.add(role))
  })

  // Initialise counters to 0
  const roleMissingCount: Record<string, number> = {}
  for (const role of allKnownRoles) {
    roleMissingCount[role] = 0
  }

  // Evaluate each model
  for await (const model of models) {
    const applicableSet = getApplicableRoleSet(schemaRoleMap, model.card?.schemaId)
    const activeRoleSet = getActiveRoleSet(model.collaborators ?? [])
    const missingRoles: { roleId: string; roleName: string }[] = []

    // Compare required roles with the roles currently assigned
    for (const roleId of applicableSet) {
      if (!activeRoleSet.has(roleId)) {
        roleMissingCount[roleId] += 1
        missingRoles.push({
          roleId,
          roleName: roleMeta[roleId]?.roleName ?? roleId,
        })
      }
    }

    // Only include the model in results if it has at least one missing role
    if (missingRoles.length > 0) {
      entriesResult.push({
        entryId: model.id,
        missingRoles,
        modelOwners: model.collaborators
          .filter((collaborator) => (collaborator.roles ?? []).includes(SystemRoles.Owner))
          .map((collaborator) => collaborator.entity),
      })
    }
  }

  const summary = Object.keys(roleMissingCount)
    .sort()
    .map((roleId) => ({
      roleId,
      roleName: roleMeta[roleId]?.roleName ?? roleId,
      count: roleMissingCount[roleId],
    }))

  return {
    summary,
    entries: entriesResult,
  }
}

async function calculateModelsMissingReleases(org?: string): Promise<NoReleasesComplianceMetricsResultSubset> {
  const filter: ModelFilter = {}

  // Only undefined means global
  if (org !== undefined) {
    filter.organisation = org
  }

  const pipeline: PipelineStage[] = [
    { $match: { ...filter, ...MODELS_KIND_FILTER } },
    {
      $lookup: {
        from: 'v2_releases',
        let: { modelId: '$id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$modelId', '$$modelId'],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: 'releaseMatch',
      },
    },
    {
      $match: {
        'releaseMatch.0': { $exists: false },
      },
    },
    {
      $project: {
        _id: 0,
        entryId: '$id',
        modelOwners: {
          $map: {
            input: {
              $filter: {
                input: '$collaborators',
                as: 'item',
                cond: { $in: ['owner', { $ifNull: ['$$item.roles', []] }] },
              },
            },
            as: 'owner',
            in: '$$owner.entity',
          },
        },
      },
    },
  ]

  // Gets models by the specified organisation | no organisation
  const entries = await ModelModel.aggregate<ModelWithNoReleases>(pipeline)

  return {
    summary: {
      modelsWithNoReleases: entries.length,
    },
    entries,
  }
}

/**
 * Builds a cache key for entry metrics based on
 * interval, date range, and timezone to ensure parameter-safe caching.
 */
function buildEntryVolumeCacheKey(interval: EntryVolumeInterval, start: Date, end: Date, timezone?: string): string {
  return ['entryVolume', interval, start.toISOString(), end.toISOString(), timezone ?? 'none'].join(':')
}

export class BaseMetricsConnector {
  organisations: string[]

  constructor(organisations: string[]) {
    this.organisations = organisations
  }

  /**
   * Retrieves the list of distinct organisation identifiers
   * for which models currently exist.
   */
  async getOrganisationIds(): Promise<string[]> {
    return [...this.organisations, '']
  }

  /**
   * Gets metrics around general model usage within Bailo.
   */
  async getUsageMetrics(user: UserInterface): Promise<GetUsageMetricsResponse> {
    const cacheKey = `${MetricsCacheKeys.USAGE}:${user.dn}`

    const cached = getCached<CachedMetrics<GetUsageMetricsResponse>>(cacheKey)
    if (cached !== undefined) {
      return {
        ...cached.data,
        lastUpdated: cached.lastUpdated,
      }
    }

    const organisationIds = await this.getOrganisationIds()

    const byOrganisation = await Promise.all(
      organisationIds.map(async (orgRaw) => {
        const organisation = orgRaw && orgRaw.trim() !== '' ? orgRaw : 'unset'

        const filter: ModelFilter = orgRaw === '' ? { organisation: '' } : { organisation: orgRaw }

        const metrics = await calculateUsageMetrics(user, filter)

        return { organisation, ...metrics }
      }),
    )

    const schemaCounts = new Map<string, SchemaInfo>()
    const stateCounts = new Map<string, StateInfo>()

    let entries = 0
    let withReleases = 0
    let withAccessRequest = 0

    // Tally up the metrics for each org to get global metrics
    for (const org of byOrganisation) {
      entries += org.entries
      withReleases += org.withReleases
      withAccessRequest += org.withAccessRequest

      for (const schema of org.schemaBreakdown ?? []) {
        const key = String(schema.schemaId)
        const existing = schemaCounts.get(key)

        if (existing) {
          existing.count += schema.count
        } else {
          schemaCounts.set(key, { ...schema, schemaId: key })
        }
      }

      for (const state of org.entryState ?? []) {
        const existing = stateCounts.get(state.state)

        if (existing) {
          existing.count += state.count
        } else {
          stateCounts.set(state.state, { ...state })
        }
      }
    }

    const global: BaseMetrics = {
      users: await calculateTotalUsers(),
      entries,
      withReleases,
      withAccessRequest,
      schemaBreakdown: Array.from(schemaCounts.values()),
      entryState: Array.from(stateCounts.values()).sort((a, b) => b.count - a.count),
    }

    const result = { global, byOrganisation }
    const lastUpdated = new Date().toISOString()

    setCached(cacheKey, {
      data: result,
      lastUpdated,
    })

    return {
      ...result,
      lastUpdated,
    }
  }

  /**
   * Gets metrics around system compliance and roles.
   */
  async getRoleComplianceMetrics(user: UserInterface): Promise<GetRoleComplianceMetricsResponse> {
    await checkUserIsAuthorised(user)

    const cached = getCached<CachedMetrics<GetRoleComplianceMetricsResponse>>(MetricsCacheKeys.ROLE_COMPLIANCE)
    if (cached !== undefined) {
      return {
        ...cached.data,
        lastUpdated: cached.lastUpdated,
      }
    }

    const { schemaRoleMap, roleMeta } = await buildSchemaRoleMap()

    const global = await calculateMissingEntryRoles(schemaRoleMap, roleMeta)

    const organisationIds = await this.getOrganisationIds()

    const byOrganisation = await Promise.all(
      organisationIds.map(async (org) => ({
        organisation: org || 'unset',
        ...(await calculateMissingEntryRoles(schemaRoleMap, roleMeta, org)),
      })),
    )

    const result = { global, byOrganisation }

    const lastUpdated = new Date().toISOString()

    setCached(MetricsCacheKeys.ROLE_COMPLIANCE, {
      data: result,
      lastUpdated,
    })

    return {
      ...result,
      lastUpdated,
    }
  }

  /**
   * Calculates metrics about entry usage over time.
   */
  async calculateEntryVolume(
    user: UserInterface,
    interval: EntryVolumeInterval,
    startDate: string | Date,
    endDate: string | Date,
    timezone?: string,
  ): Promise<GetEntryVolumeResponse> {
    await checkUserIsAuthorised(user)

    const start = new Date(startDate)
    const end = new Date(endDate)

    const cacheKey = buildEntryVolumeCacheKey(interval, start, end, timezone)

    const cached = getCached<CachedMetrics<GetEntryVolumeResponse>>(cacheKey)
    if (cached !== undefined) {
      return {
        ...cached.data,
        lastUpdated: cached.lastUpdated,
      }
    }

    try {
      const alignedResult = await ModelModel.aggregate<{ alignedStart: Date }>([
        {
          $project: {
            alignedStart: {
              $dateTrunc: {
                date: start,
                unit: interval,
                ...(interval === 'week' ? { startOfWeek: 'sunday' } : {}),
                ...(timezone && { timezone }),
              },
            },
          },
        },
        { $limit: 1 },
      ])

      const alignedStart = alignedResult[0]?.alignedStart ?? new Date(start)

      // Aggregate counts per time interval and organisation
      const endExclusive = addInterval(end, 'day')
      const pipeline: PipelineStage[] = [
        {
          $match: {
            createdAt: { $gte: start, $lt: endExclusive },
          },
        },
        {
          $group: {
            _id: {
              periodStart: {
                $dateTrunc: {
                  date: '$createdAt',
                  unit: interval,
                  ...(interval === 'week' ? { startOfWeek: 'sunday' } : {}),
                  ...(timezone && { timezone }),
                },
              },
              organisation: {
                $cond: {
                  if: { $or: [{ $eq: ['$organisation', null] }, { $eq: ['$organisation', ''] }] },
                  then: 'unset',
                  else: '$organisation',
                },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.periodStart': 1 } },
      ]

      const results = await ModelModel.aggregate<{
        _id: { periodStart: Date; organisation: string }
        count: number
      }>(pipeline)

      // Convert aggregation results into a lookup map
      const intervalMap = new Map<string, Record<string, number>>()

      for (const row of results) {
        const key = row._id.periodStart.toISOString()

        if (!intervalMap.has(key)) {
          intervalMap.set(key, {})
        }

        intervalMap.get(key)![row._id.organisation] = row.count
      }

      // Derive full organisation list from database
      const distinctOrgs = await ModelModel.distinct('organisation')
      const allOrgs = distinctOrgs.filter((org) => org && org.trim() !== '')

      // Always include "unset"
      if (!allOrgs.includes('unset')) {
        allOrgs.push('unset')
      }

      const intervals: EntryVolumeDataPoint[] = []

      let cursor = new Date(alignedStart)

      // Generate intervals from start to end date, filling gaps with zero counts
      while (cursor < endExclusive) {
        const intervalStart = new Date(cursor)
        const intervalEnd = addInterval(intervalStart, interval)

        const key = intervalStart.toISOString()
        const orgCounts = intervalMap.get(key) ?? {}

        const organisationsObject: Record<string, number> = {}
        let total = 0

        for (const org of allOrgs) {
          const count = orgCounts[org] ?? 0
          organisationsObject[org] = count
          total += count
        }

        intervals.push({
          startDate: intervalStart.toISOString(),
          endDate: intervalEnd.toISOString(),
          count: total,
          organisations: organisationsObject,
        })

        cursor = addInterval(cursor, interval)
      }

      const result = {
        interval,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        data: intervals,
      }

      const lastUpdated = new Date().toISOString()

      setCached(cacheKey, {
        data: result,
        lastUpdated,
      })

      return {
        ...result,
        lastUpdated,
      }
    } catch (err: unknown) {
      if (isMongoServerError(err)) {
        const message = err.message ?? ''

        if (message.includes('timezone') || message.includes('Time zone')) {
          throw BadReq('Invalid timezone. Must be a valid IANA timezone or UTC offset.')
        }
      }

      throw err
    }
  }

  /**
   * Gets compliance metrics for models without releases.
   */
  async getNoReleasesMetrics(user: UserInterface): Promise<GetNoReleasesComplianceMetricsResponse> {
    await checkUserIsAuthorised(user)

    const cached = getCached<CachedMetrics<GetNoReleasesComplianceMetricsResponse>>(
      MetricsCacheKeys.NO_RELEASES_COMPLIANCE,
    )
    if (cached !== undefined) {
      return {
        ...cached.data,
        lastUpdated: cached.lastUpdated,
      }
    }

    const global = await calculateModelsMissingReleases()

    const organisationIds = await this.getOrganisationIds()

    const byOrganisation = await Promise.all(
      organisationIds.map(async (org) => ({
        organisation: org || 'unset',
        ...(await calculateModelsMissingReleases(org)),
      })),
    )

    const result: NoReleasesComplianceMetricsResult = { global, byOrganisation }

    const lastUpdated = new Date().toISOString()

    setCached(MetricsCacheKeys.NO_RELEASES_COMPLIANCE, {
      data: result,
      lastUpdated,
    })

    return {
      ...result,
      lastUpdated,
    }
  }

  /**
   * Calculates the model breakdown for a given query.
   */
  async calculateModelBreakdown(
    user: UserInterface,
    query: MetricsEntrySearchOptionsParams,
  ): Promise<GetModelBreakdownResponse> {
    await checkUserIsAuthorised(user)

    const mongoQuery: QueryFilter<ModelInterface> = {}

    const idFilter: {
      $in?: string[]
      $nin?: string[]
    } = {}

    // Filter by organisation only if provided and not 'all' - if 'none' then query any with empty string
    if (query.organisation !== undefined && query.organisation.toLowerCase() !== 'all') {
      mongoQuery.organisation = query.organisation.toLowerCase() === 'unset' ? '' : query.organisation
    }

    // Filter by model state if provided
    if (query.state !== undefined) {
      mongoQuery.state = query.state.toLowerCase() === 'none' ? '' : query.state
    }

    // Filter by schemaId if provided
    if (query.schemaId !== undefined) {
      if (query.schemaId.toLowerCase() === 'none') {
        mongoQuery['card.schemaId'] = { $exists: false }
      } else {
        mongoQuery['card.schemaId'] = query.schemaId
      }
    }

    // Filter by entry kind(s) if provided (model, data-card, mirrored-model, untrusted-model)
    if (query.kind !== undefined && query.kind.length > 0) {
      const validKinds = Object.values(EntryKind)
      const invalidKinds = query.kind.filter((kind) => !validKinds.includes(kind))

      if (invalidKinds.length > 0) {
        throw BadReq(`Invalid entryKind. Must be one of: ${validKinds.join(', ')}.`, {
          entryKind: invalidKinds,
        })
      }

      mongoQuery.kind = { $in: query.kind }
    }

    // Filter by models with releases if provided
    if (query.release !== undefined) {
      const releaseModelIds = await ReleaseModel.distinct('modelId')

      if (query.release.toLowerCase() === EntryFilter.WITH) {
        idFilter.$in = releaseModelIds
      } else {
        idFilter.$nin = releaseModelIds
      }
    }

    // Filter by models with access requests if provided
    if (query.accessRequest !== undefined) {
      const accessRequestModelIds = await AccessRequestModel.distinct('modelId')
      const accessRequestModelIdSet = new Set(accessRequestModelIds)

      if (query.accessRequest.toLowerCase() === EntryFilter.WITH) {
        idFilter.$in = idFilter.$in
          ? idFilter.$in.filter((id) => accessRequestModelIdSet.has(id))
          : accessRequestModelIds
      } else {
        idFilter.$nin = [...(idFilter.$nin ?? []), ...accessRequestModelIds]
      }
    }

    // Filter by createdAt month range if provided. startMonth and endMonth are
    // each independently optional, so only add the bound that was supplied.
    if (query.startMonth !== undefined || query.endMonth !== undefined) {
      const createdAtFilter: { $gte?: Date; $lt?: Date } = {}

      if (query.startMonth !== undefined) {
        const start = new Date(query.startMonth)
        if (isNaN(start.getTime())) {
          throw BadReq('Invalid startMonth. Must be in the format YYYY-MM.', { startMonth: query.startMonth })
        }
        createdAtFilter.$gte = start
      }

      if (query.endMonth !== undefined) {
        const end = new Date(query.endMonth)
        if (isNaN(end.getTime())) {
          throw BadReq('Invalid endMonth. Must be in the format YYYY-MM.', { endMonth: query.endMonth })
        }
        createdAtFilter.$lt = addInterval(end, 'month')
      }

      if (query.startMonth && query.endMonth && query.startMonth > query.endMonth) {
        throw BadReq('startMonth must be before or equal to endMonth')
      }

      mongoQuery.createdAt = createdAtFilter
    }

    if (Object.keys(idFilter).length > 0) {
      mongoQuery.id = idFilter
    }

    const models = await ModelModel.find(mongoQuery)
      .select({
        id: true,
        name: true,
        kind: true,
        collaborators: true,
        _id: false,
      })
      .sort({
        updatedAt: -1,
      })
      .lean()

    return models.map((model) => ({
      entryId: model.id,
      entryName: model.name,
      entryKind: model.kind,
      collaborators:
        model.collaborators?.map((collaborator) => ({
          entity: collaborator.entity,
          roles: collaborator.roles ?? [],
        })) ?? [],
    }))
  }
}
