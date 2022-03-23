import { Request, Response } from 'express'
import bodyParser from 'body-parser'
import SchemaModel from '../../models/Schema'
import { validateSchema } from '../../utils/validateSchema'
import { customAlphabet } from 'nanoid'
import { ensureUserRole } from '../../utils/user'
import { createDeploymentRequests } from '../../services/request'
import { BadReq, NotFound, Forbidden } from '../../utils/result'
import { findModelByUuid } from '../../services/model'
import { findVersionByName } from '../../services/version'
import { createDeployment, findDeploymentByUuid, findDeployments } from '../../services/deployment'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

export const getDeployment = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const deployment = await findDeploymentByUuid(req.user!, uuid)

    if (!deployment) {
      throw NotFound({ uuid }, `Unable to find deployment '${uuid}'`)
    }

    req.log.info({ deployment }, 'Fetching deployment by a given UUID')
    return res.json(deployment)
  },
]

export const getCurrentUserDeployments = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params

    const deployments = await findDeployments(req.user!, { owner: id })

    req.log.info({ deployments }, 'Fetching deployments by user')

    return res.json(deployments)
  },
]

export const postDeployment = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    req.log.info('User requesting deployment')
    const body = req.body as any

    const schema = await SchemaModel.findOne({
      reference: body.schemaRef,
    })

    if (!schema) {
      throw NotFound({ schemaRef: body.schemaRef }, `Unable to find schema with name: '${body.schemaRef}'`)
    }

    body.user = req.user?.id
    body.timeStamp = new Date().toISOString()

    // first, we verify the schema
    const schemaIsInvalid = validateSchema(body, schema.schema)
    if (schemaIsInvalid) {
      throw NotFound({ errors: schemaIsInvalid }, 'Rejected due to invalid schema')
    }

    const model = await findModelByUuid(req.user!, body.highLevelDetails.modelID)

    if (!model) {
      throw NotFound(
        { modelId: body.highLevelDetails.modelID },
        `Unable to find model with name: '${body.highLevelDetails.modelID}'`
      )
    }

    const name = body.highLevelDetails.name
      .toLowerCase()
      .replace(/[^a-z 0-9]/g, '')
      .replace(/ /g, '-')

    const uuid = `${name}-${nanoid()}`
    req.log.info({ uuid }, `Named deployment '${uuid}'`)

    const deployment = await createDeployment(req.user!, {
      schemaRef: body.schemaRef,
      uuid: uuid,

      model: model._id,
      metadata: body,

      owner: req.user!._id,
    })

    req.log.info({ deployment }, 'Saving deployment model')
    await deployment.save()

    req.log.info({ model, version: body.highLevelDetails.initialVersionRequested }, 'Requesting model version')
    const version = await findVersionByName(req.user!, model._id, body.highLevelDetails.initialVersionRequested)

    if (!version) {
      throw NotFound(
        { version: body.highLevelDetails.initialVersionRequested },
        `Unable to find version: '${body.highLevelDetails.initialVersionRequested}'`
      )
    }

    const managerRequest = await createDeploymentRequests({ version, deployment: await deployment.populate('model') })
    req.log.info({ request: managerRequest._id, uuid }, 'Successfully created deployment')

    res.json({
      uuid,
    })
  },
]

export const resetDeploymentApprovals = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    const user = req.user
    const { uuid } = req.params
    const deployment = await findDeploymentByUuid(req.user!, uuid)
    if (!deployment) {
      throw BadReq({ uuid }, `Unabled to find version for requested deployment: '${uuid}'`)
    }
    if (user?.id !== deployment.metadata.contacts.requester) {
      throw Forbidden({}, 'You cannot reset the approvals for a deployment you do not own.')
    }

    const version = await findVersionByName(
      user!,
      deployment.model,
      deployment.metadata.highLevelDetails.initialVersionRequested
    )
    if (!version) {
      throw BadReq({ uuid }, `Unabled to find version for requested deployment: '${uuid}'`)
    }
    deployment.managerApproved = 'No Response'
    await deployment.save()
    req.log.info({ deployment }, 'User resetting deployment approvals')
    await createDeploymentRequests({ version, deployment: await deployment.populate('model') })

    return res.json(deployment)
  },
]
