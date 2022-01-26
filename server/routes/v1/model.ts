import ModelModel from '../../models/Model'
import { Request, Response } from 'express'
import SchemaModel from '../../models/Schema'
import VersionModel from '../../models/Version'
import DeploymentModel from '../../models/Deployment'
import { ensureUserRole } from '../../utils/user'

export const getModels = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { type, logs, filter } = req.query
    const query: any = filter ? { $text: { $search: filter as string } } : {}

    if (type === 'starred') {
      req.log.info('Limiting model requests to starred')
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

export const getModel = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const model = await ModelModel.findOne({ uuid })

    if (!model) {
      req.log.warn({ uuid }, 'Unable to find model')
      return res.status(404).json({
        message: `Unable to find model '${uuid}'`,
      })
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
      req.log.warn({ uuid }, 'Unable to find model')
      return res.status(404).json({
        message: `Unable to find model '${uuid}'`,
      })
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
      req.log.warn({ uuid }, 'Unable to find model')
      return res.status(404).json({
        message: `Unable to find model '${uuid}'`,
      })
    }

    const schema = await SchemaModel.findOne({ reference: model.schemaRef })

    if (!schema) {
      req.log.warn({ uuid, schemaRef: model.schemaRef }, 'Unable to find schema')
      return res.status(404).json({
        message: `Unable to find schema '${model.schemaRef}'`,
      })
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
      req.log.warn({ uuid }, 'Unable to find model')
      return res.status(404).json({
        message: `Unable to find model '${uuid}'`,
      })
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
      req.log.warn({ uuid }, 'Unable to find model')
      return res.status(404).json({
        message: `Unable to find model '${uuid}'`,
      })
    }

    let version
    if (versionName === 'latest') {
      version = await VersionModel.findOne({ _id: model.versions[model.versions.length - 1] })
    } else {
      version = await VersionModel.findOne({ model: model._id, version: versionName })
    }

    if (!version) {
      req.log.warn({ versionName }, 'Unable to find model')
      return res.status(404).json({
        message: `Unable to find version '${versionName}'`,
      })
    }

    return res.json(version)
  },
]
