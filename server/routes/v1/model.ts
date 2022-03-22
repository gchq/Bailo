import { Request, Response } from 'express'
import SchemaModel from '../../models/Schema'
import { ensureUserRole } from '../../utils/user'
import { BadReq, NotFound } from '../../utils/result'
import { findModelById, findModelByUuid, findModels, isValidFilter, isValidType } from '../../services/model'
import { findModelVersions, findVersionById, findVersionByName } from '../../services/version'
import { findDeployments } from '../../services/deployment'
import _ from 'lodash'
import { Model } from '../../../types/interfaces'

const modelSubset = (model: Model) => {
  return _.pick(model, ['_id', 'uuid', 'schemaRef'])
}

export const getModels = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { type, filter } = req.query

    if (!isValidType(type)) {
      throw BadReq({ type }, `Provided invalid type '${type}'`)
    }

    if (!isValidFilter(filter)) {
      throw BadReq({ filter }, `Provided invalid filter '${filter}'`)
    }

    const models = await findModels(req.user!, { filter: filter as string, type })
    const modelSubsets = models.map((model) => {
      return modelSubset(model)
    })

    req.log.info({ models: modelSubsets }, 'User fetching all models')

    return res.json({
      models,
    })
  },
]

export const getModelByUuid = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await findModelByUuid(req.user!, uuid)

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    req.log.info({ model: modelSubset(model) }, 'User fetching model by given UUID')
    return res.json(model)
  },
]

export const getModelById = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params

    const model = await findModelById(req.user!, id)

    if (!model) {
      throw NotFound({ id }, `Unable to find model '${id}'`)
    }

    req.log.info({ model: modelSubset(model) }, 'User fetching model by given ID')
    return res.json(model)
  },
]

export const getModelDeployments = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await findModelByUuid(req.user!, uuid)

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    const deployments = await findDeployments(req.user!, { model: model._id })

    req.log.info({ model: modelSubset(model) }, 'User fetching all deployments for model')
    return res.json(deployments)
  },
]

export const getModelSchema = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await findModelByUuid(req.user!, uuid)

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    const schema = await SchemaModel.findOne({ reference: model.schemaRef })

    if (!schema) {
      throw NotFound({ uuid, schemaRef: model.schemaRef }, `Unable to find schema '${model.schemaRef}'`)
    }

    req.log.info({ model: modelSubset(model) }, 'User fetching model schema')
    return res.json(schema)
  },
]

export const getModelVersions = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await findModelByUuid(req.user!, uuid)

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    const versions = await findModelVersions(req.user!, model._id, { thin: true })

    req.log.info({ model: modelSubset(model) }, 'User fetching versions for specified model')
    return res.json(versions)
  },
]

export const getModelVersion = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid, version: versionName } = req.params

    const model = await findModelByUuid(req.user!, uuid)

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    let version
    if (versionName === 'latest') {
      version = await findVersionById(req.user!, model.versions[model.versions.length - 1])
    } else {
      version = await findVersionByName(req.user!, model._id, versionName)
    }

    if (!version) {
      throw NotFound({ versionName }, `Unable to find verison '${versionName}'`)
    }

    req.log.info(
      { model: modelSubset(model), version },
      'User finding specific version for model'
    )
    return res.json(version)
  },
]
