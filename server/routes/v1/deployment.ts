import { Request, Response } from 'express'
import bodyParser from 'body-parser'
import Minio from 'minio'
import { validateSchema } from '../../utils/validateSchema'
import { customAlphabet } from 'nanoid'
import { ensureUserRole } from '../../utils/user'
import { createDeploymentRequests } from '../../services/request'
import { BadReq, NotFound, Forbidden, Conflict, Unauthorised } from '../../utils/result'
import { findModelById, findModelByUuid, isValidFilter } from '../../services/model'
import { findVersionById, findVersionByName } from '../../services/version'
import {
  createDeployment,
  createPublicDeployment,
  findDeploymentByUuid,
  findDeployments,
  findPublicDeploymentByUuid,
  findPublicDeploymentByVersion,
  findPublicDeployments,
} from '../../services/deployment'
import { ApprovalStates, DeploymentDoc, PublicDeploymentDoc } from '../../models/Deployment'
import { findSchemaByRef } from '../../services/schema'
import { getDeploymentQueue } from '../../utils/queues'
import { ModelDoc } from '../../models/Model'
import { VersionDoc } from '../../models/Version'
import config from 'config'
import { Readable } from 'stream'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

export const getDeployment = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const deployment = await findDeploymentByUuid(req.user!, uuid)

    if (!deployment) {
      throw NotFound({ code: 'deployment_not_found', uuid }, `Unable to find deployment '${uuid}'`)
    }

    req.log.info({ code: 'get_deployment_by_uuid', deployment }, 'Fetching deployment by a given UUID')
    return res.json(deployment)
  },
]

export const getCurrentUserDeployments = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params

    const deployments = await findDeployments(req.user!, { owner: id })

    req.log.info({ code: 'fetch_deployments_by_user', deployments }, 'Fetching deployments by user')

    return res.json(deployments)
  },
]

export const postDeployment = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    req.log.info({ code: 'requesting_deployment' }, 'User requesting deployment')
    const body = req.body as any

    const schema = await findSchemaByRef(body.schemaRef)
    if (!schema) {
      throw NotFound(
        { code: 'schema_not_found', schemaRef: body.schemaRef },
        `Unable to find schema with name: '${body.schemaRef}'`
      )
    }

    body.user = req.user?.id
    body.timeStamp = new Date().toISOString()

    // first, we verify the schema
    const schemaIsInvalid = validateSchema(body, schema.schema)
    if (schemaIsInvalid) {
      throw NotFound({ code: 'invalid_schema', errors: schemaIsInvalid }, 'Rejected due to invalid schema')
    }

    const model = await findModelByUuid(req.user!, body.highLevelDetails.modelID)

    if (!model) {
      throw NotFound(
        { code: 'model_not_found', modelId: body.highLevelDetails.modelID },
        `Unable to find model with name: '${body.highLevelDetails.modelID}'`
      )
    }

    const name = body.highLevelDetails.name
      .toLowerCase()
      .replace(/[^a-z 0-9]/g, '')
      .replace(/ /g, '-')

    const uuid = `${name}-${nanoid()}`
    req.log.info({ uuid }, `Named deployment '${uuid}'`)

    const version = await findVersionByName(req.user!, model._id, body.highLevelDetails.initialVersionRequested)

    const versionArray: any = [version!._id]

    let deployment

    deployment = await createDeployment(req.user!, {
      schemaRef: body.schemaRef,
      uuid: uuid,

      versions: versionArray,
      model: model._id,
      metadata: body,

      owner: req.user!._id,
    })

    req.log.info({ code: 'saving_deployment', deployment }, 'Saving deployment model')
    await deployment.save()

    req.log.info(
      { code: 'requesting_model_version', model, version: body.highLevelDetails.initialVersionRequested },
      'Requesting model version'
    )

    if (!version) {
      throw NotFound(
        { code: 'version_not_found', version: body.highLevelDetails.initialVersionRequested },
        `Unable to find version: '${body.highLevelDetails.initialVersionRequested}'`
      )
    }

    const managerRequest = await createDeploymentRequests({
      version,
      deployment: await deployment.populate('model').execPopulate(),
    })
    req.log.info({ code: 'created_deployment', request: managerRequest._id, uuid }, 'Successfully created deployment')

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
      throw BadReq({ code: 'deployment_not_found', uuid }, `Unabled to find requested deployment: '${uuid}'`)
    }
    if (user?.id !== deployment.metadata.contacts.requester) {
      throw Forbidden(
        { code: 'not_allowed_to_reset_approvals' },
        'You cannot reset the approvals for a deployment you do not own.'
      )
    }

    const version = await findVersionByName(
      user!,
      deployment.model,
      deployment.metadata.highLevelDetails.initialVersionRequested
    )
    if (!version) {
      throw BadReq(
        { code: 'deployment_version_not_found', uuid },
        `Unabled to find version for requested deployment: '${uuid}'`
      )
    }
    deployment.managerApproved = ApprovalStates.NoResponse
    await deployment.save()
    req.log.info({ code: 'reset_deployment_approvals', deployment }, 'User resetting deployment approvals')
    await createDeploymentRequests({ version, deployment: await deployment.populate('model').execPopulate() })

    return res.json(deployment)
  },
]

export const getPublicDeployments = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    let { filter } = req.query

    if (filter === undefined) filter = ''

    if (!isValidFilter(filter)) {
      throw BadReq({ code: 'invalid_filter', filter }, `Provided invalid filter '${filter}'`)
    }

    const models = await findPublicDeployments(req.user!, filter as string)

    req.log.info({ code: 'fetching_models', models }, 'User fetching all models')

    return res.json({
      models,
    })
  },
]

export const getPublicDeployment = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params

    const publicDeployment = await findPublicDeploymentByUuid(req.user!, uuid)

    if (!publicDeployment) {
      throw NotFound({ code: 'deployment_not_found', uuid }, `Unable to find deployment '${uuid}'`)
    }

    req.log.info(
      { code: 'get_public_deployment_by_uuid', publicDeployment },
      'Fetching public deployment by a given UUID'
    )
    return res.json(publicDeployment)
  },
]

export const getPublicDeploymentByVersion = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { version } = req.params

    const publicDeployment = await findPublicDeploymentByVersion(req.user!, version)

    if (!publicDeployment) {
      throw NotFound({ code: 'deployment_not_found', version }, `Unable to find deployment for version '${version}'`)
    }

    req.log.info(
      { code: 'get_public_deployment_by_version', publicDeployment },
      'Fetching public deployment by a given version ID'
    )
    return res.json(publicDeployment)
  },
]

export const postPublicDeployment = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    req.log.info({ code: 'requesting_public_deployment' }, 'User requesting public deployment')

    const body = req.body as any
    const { modelId, versionId, deploymentName } = body

    body.user = req.user?.id
    body.timeStamp = new Date().toISOString()

    const version: VersionDoc | null = await findVersionById(req.user!, versionId)

    if (!version) {
      throw NotFound(
        { code: 'version_not_found', versionId: versionId },
        `Unable to find version with name: ${versionId} for model: ${modelId}`
      )
    }

    if (!version.metadata.buildOptions?.allowPublicDeployments) {
      throw BadReq(
        { code: 'public_deployment_not_allowed', versionId: versionId },
        `Public deployment not allowed for version ${versionId}`
      )
    }

    const model: ModelDoc | null = await findModelById(req.user!, modelId)

    if (!model) {
      throw NotFound({ code: 'model_not_found', modelId: modelId }, `Unable to find model with name: '${modelId}'`)
    }

    const name = deploymentName
      .toLowerCase()
      .replace(/[^a-z 0-9]/g, '')
      .replace(/ /g, '-')

    const uuid = `${name}-${nanoid()}`
    req.log.info({ uuid }, `Named public deployment '${uuid}'`)

    try {
      const publicDeployment: PublicDeploymentDoc = await createPublicDeployment(req.user!, {
        uuid: uuid,

        version: version._id,
        model: model._id,

        owner: req.user!._id,
      })

      req.log.info({ code: 'saving_public_deployment', publicDeployment }, 'Saving public deployment model')

      await publicDeployment.save()
      req.log.info({ code: 'triggered_deployments', publicDeployment }, 'Triggered public deployment')
      await (
        await getDeploymentQueue()
      ).add({
        deploymentId: publicDeployment._id,
        userId: req.user!._id,
        type: 'public',
      })
    } catch (e: any) {
      if (e.code === 11000) {
        throw Conflict({ versionId }, 'Public deployment already exists for this version')
      }
    }

    return res.json(uuid)
  },
]

export const fetchRawModelFiles = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    const { uuid, version, fileType } = req.params
    const deployment: DeploymentDoc | null = await findDeploymentByUuid(req.user!, uuid)

    if (deployment === null) {
      throw NotFound({ deploymentUuid: uuid }, `Unable to find deployment for uuid ${uuid}`)
    }

    if (!req.user._id.equals(deployment.owner)) {
      throw Unauthorised(
        { deploymentOwner: deployment.owner },
        `User is not authorised to download this file. Requester: ${req.user._id}, owner: ${deployment.owner}`
      )
    }

    if (fileType !== 'code' && fileType !== 'binary') {
      throw NotFound({ fileType }, 'Unknown file type specificed')
    }

    const versionDocument: VersionDoc | null = await findVersionByName(req.user!, deployment.model, version)
    const bucketName: string = config.get('minio.uploadBucket')
    const client = new Minio.Client(config.get('minio'))

    if (versionDocument === null) {
      throw NotFound({ versionId: version }, `Unable to find version for id ${version}`)
    }

    let filePath

    if (fileType === 'code') {
      filePath = versionDocument.rawCodePath
    }
    if (fileType === 'binary') {
      filePath = versionDocument.rawBinaryPath
    }

    // Stat object to get size so browser can determine progress
    const { size } = await client.statObject(bucketName, filePath)

    //res.set('Content-Disposition', contentDisposition(fileType, { type: 'inline' }))
    res.set('Content-disposition', `attachment; filename=${fileType}.zip`)
    res.set('Content-Type', 'application/zip')
    res.set('Cache-Control', 'private, max-age=604800, immutable')
    res.set('Content-Length', size.toString())
    res.writeHead(200)

    const stream: Readable = await client.getObject(bucketName, filePath)
    if (stream !== null) {
      console.log(filePath)
      stream.pipe(res)
    }
  },
]
