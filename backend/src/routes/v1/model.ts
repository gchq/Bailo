import { Request, Response } from 'express'

import { findDeployments } from '../../services/deployment.js'
import { findModelById, findModelByUuid, findModels, isValidFilter, isValidType } from '../../services/model.js'
import { findSchemaByRef } from '../../services/schema.js'
import { findModelVersions, findVersionById, findVersionByName } from '../../services/version.js'
import { VersionDoc } from '../../types/types.js'
import { isUserInEntityList } from '../../utils/entity.js'
import { BadReq, NotFound, NotImplemented } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'

export const getModels = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    let { type, filter } = req.query

    if (filter === undefined) filter = ''
    if (type === undefined) type = 'all'

    if (!isValidType(type)) {
      throw BadReq({ code: 'model_invalid_type', type }, `Provided invalid type '${type}'`)
    }

    if (!isValidFilter(filter)) {
      throw BadReq({ code: 'model_invalid_filter', filter }, `Provided invalid filter '${filter}'`)
    }

    const models = await findModels(req.user, { filter: filter as string, type }, { populate: true })

    req.log.info({ code: 'fetching_models', models }, 'User fetching all models')

    return res.json({
      models,
    })
  },
]

export const getModelByUuid = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await findModelByUuid(req.user, uuid, { populate: true })

    if (!model) {
      throw NotFound({ code: 'model_not_found', uuid }, `Unable to find model '${uuid}'`)
    }

    req.log.info({ code: 'fetch_model_by_uuid', model }, 'User fetching model by given UUID')
    return res.json(model)
  },
]

export const getModelById = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params

    const model = await findModelById(req.user, id, { populate: true })

    if (!model) {
      throw NotFound({ code: 'model_not_found', id }, `Unable to find model '${id}'`)
    }

    req.log.info({ code: 'fetch_model_by_id', model }, 'User fetching model by given ID')
    return res.json(model)
  },
]

export const getModelDeployments = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await findModelByUuid(req.user, uuid)

    if (!model) {
      throw NotFound({ code: 'model_not_found', uuid }, `Unable to find model '${uuid}'`)
    }

    const deployments = await findDeployments(req.user, { model: model._id })

    req.log.info(
      { code: 'fetch_deployments_by_model', modelId: model._id, deployments },
      'User fetching all deployments for model'
    )
    return res.json(deployments)
  },
]

export const getModelSchema = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await findModelByUuid(req.user, uuid)

    if (!model) {
      throw NotFound({ code: 'model_not_found', uuid }, `Unable to find model '${uuid}'`)
    }

    const schema = await findSchemaByRef(model.schemaRef)
    if (!schema) {
      throw NotFound(
        { code: 'schema_not_found', uuid, schemaRef: model.schemaRef },
        `Unable to find schema '${model.schemaRef}'`
      )
    }

    req.log.info({ code: 'fetch_model_schema', model }, 'User fetching model schema')
    return res.json(schema)
  },
]

export const getModelVersions = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params
    const { logs } = req.query
    const showLogs = logs === 'true'

    const model = await findModelByUuid(req.user, uuid, { populate: true })

    if (!model) {
      throw NotFound({ code: 'model_not_found', uuid }, `Unable to find model '${uuid}'`)
    }

    const versions = await findModelVersions(req.user, model._id, { thin: true, showLogs })

    req.log.info(
      { code: 'fetch_versions_for_model', modelId: model._id, versions },
      'User fetching versions for specified model'
    )
    return res.json(versions)
  },
]

export const getModelVersion = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid, version: versionName } = req.params
    const { logs } = req.query
    const showLogs = logs === 'true'

    const model = await findModelByUuid(req.user, uuid)

    if (!model) {
      throw NotFound({ code: 'model_not_found', uuid }, `Unable to find model '${uuid}'`)
    }

    let version
    if (versionName === 'latest') {
      version = await findVersionById(req.user, model.versions[model.versions.length - 1], { showLogs, populate: true })
    } else {
      version = await findVersionByName(req.user, model._id, versionName, { showLogs, populate: true })
    }

    if (!version) {
      throw NotFound({ code: 'version_not_found', versionName }, `Unable to find version '${versionName}'`)
    }

    req.log.info(
      { code: 'fetch_version_for_model', modelId: model._id, version },
      'User finding specific version for model'
    )
    return res.json(version)
  },
]

export const getModelAccess = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { user } = req
    const { uuid } = req.params

    const model = await findModelByUuid(req.user, uuid)

    if (!model) {
      throw NotFound({ code: 'model_not_found', uuid }, `Unable to find model '${uuid}'`)
    }

    const latestVersion = model.latestVersion as VersionDoc

    const [uploader, reviewer, manager] = await Promise.all([
      isUserInEntityList(user, latestVersion.metadata.contacts.uploader),
      isUserInEntityList(user, latestVersion.metadata.contacts.reviewer),
      isUserInEntityList(user, latestVersion.metadata.contacts.manager),
    ])

    return res.json({
      uploader,
      reviewer,
      manager,
    })
  },
]

export const deleteModel = [
  ensureUserRole('user'),
  async (_req: Request, _res: Response) => {
    throw NotImplemented({}, 'This API call is temporarily unavailable')
  },
]
