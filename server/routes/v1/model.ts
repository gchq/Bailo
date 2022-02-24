import ModelModel from '../../models/Model'
import { Request, Response } from 'express'
import SchemaModel from '../../models/Schema'
import VersionModel from '../../models/Version'
import DeploymentModel from '../../models/Deployment'
import { ensureUserRole } from '../../utils/user'
import { NotFound } from '../../utils/result'

export const getModels = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { type, filter } = req.query
    const query: any = filter ? { $text: { $search: filter as string } } : {}

    if (type === 'favourites') {
      req.log.info('Limiting model requests to favourites')
      query._id = {
        $in: req.user?.favourites,
      }
    }

    if (type === 'mine') {
      req.log.info('Limiting model requests to mine')
      query.owner = req.user?._id
    }

    const models = await ModelModel.find(query).sort({ updatedAt: -1 })

    return res.json({
      models,
    })
  },
]

export const getModelByUuid = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await ModelModel.findOne({ uuid })

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    return res.json(model)
  },
]

export const getModelById = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params

    const model = await ModelModel.findOne({ _id: id })

    if (!model) {
      throw NotFound({ id }, `Unable to find model '${id}'`)
    }

    return res.json(model)
  },
]

export const getModelDeployments = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await ModelModel.findOne({ uuid })

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    const deployments = await DeploymentModel.find({
      model: model._id,
    })

    return res.json(deployments)
  },
]

export const getModelSchema = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await ModelModel.findOne({ uuid })

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    const schema = await SchemaModel.findOne({ reference: model.schemaRef })

    if (!schema) {
      throw NotFound({ uuid, schemaRef: model.schemaRef }, `Unable to find schema '${model.schemaRef}'`)
    }

    return res.json(schema)
  },
]

export const getModelVersions = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await ModelModel.findOne({ uuid })

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    const versions = await VersionModel.find({ model: model._id }, { state: 0, logs: 0, metadata: 0 })

    return res.json(versions)
  },
]

export const getModelVersion = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid, version: versionName } = req.params

    const model = await ModelModel.findOne({ uuid })

    if (!model) {
      throw NotFound({ uuid }, `Unable to find model '${uuid}'`)
    }

    let version
    if (versionName === 'latest') {
      version = await VersionModel.findOne({ _id: model.versions[model.versions.length - 1] })
    } else {
      version = await VersionModel.findOne({ model: model._id, version: versionName })
    }

    if (!version) {
      throw NotFound({ versionName }, `Unable to find verison '${versionName}'`)
    }

    return res.json(version)
  },
]
