import { ModelDoc } from '../../types/types.js'
import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { customAlphabet } from 'nanoid'

import { createDeploymentApprovals, requestDeploymentsForModelVersions } from '../../services/approval.js'
import { createDeployment, findDeploymentByUuid, findDeployments } from '../../services/deployment.js'
import { findModelByUuid } from '../../services/model.js'
import { findSchemaByRef } from '../../services/schema.js'
import { findVersionById, findVersionByName } from '../../services/version.js'
import { ApprovalStates, EntityKind } from '../../types/types.js'
import config from '../../utils/config.js'
import { isUserInEntityList, parseEntityList } from '../../utils/entity.js'
import { getClient } from '../../utils/minio.js'
import { BadReq, Forbidden, NotFound, Unauthorised } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'
import { validateSchema } from '../../utils/validateSchema.js'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

export const getDeployment = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { uuid } = req.params
    const { logs } = req.query
    const showLogs = logs === 'true'

    const deployment = await findDeploymentByUuid(req.user, uuid, { showLogs })

    if (!deployment) {
      throw NotFound({ code: 'deployment_not_found', uuid }, `Unable to find deployment '${uuid}'`)
    }

    req.log.info({ code: 'get_deployment_by_uuid', deployment }, 'Fetching deployment by a given UUID')
    return res.json(deployment)
  },
]

export const getUserDeployments = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { logs } = req.query
    const showLogs = logs === 'true'

    const deployments = await findDeployments(req.user, { owner: id }, { showLogs })

    req.log.info({ code: 'fetch_deployments_by_user', deployments }, 'Fetching deployments by user')

    return res.json(deployments)
  },
]

export const postDeployment = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    req.log.info({ code: 'requesting_deployment' }, 'User requesting deployment')
    const { body } = req

    const schema = await findSchemaByRef(body.schemaRef)
    if (!schema) {
      throw NotFound(
        { code: 'schema_not_found', schemaRef: body.schemaRef },
        `Unable to find schema with name: '${body.schemaRef}'`
      )
    }

    body.timeStamp = new Date().toISOString()

    // first, we verify the schema
    const schemaIsInvalid = validateSchema(body, schema.schema)
    if (schemaIsInvalid) {
      throw BadReq(
        { code: 'invalid_schema', errors: schemaIsInvalid, schemaRef: body.schemaRef },
        `Your deployment does not conform to the schema: '${body.schemaRef}'`
      )
    }

    const model = await findModelByUuid(req.user, body.highLevelDetails.modelID)

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

    const owner = await parseEntityList(body.contacts.owner)

    if (!owner.valid) {
      throw NotFound({ code: 'requester_not_found' }, `Invalid requester: ${owner.reason}`)
    }

    const deployment = await createDeployment(req.user, {
      schemaRef: body.schemaRef,
      uuid,

      model: model._id,
      metadata: body,
    })

    req.log.info({ code: 'saving_deployment', deployment }, 'Saving deployment model')
    await deployment.save()

    req.log.info({ code: 'named_deployment', deploymentId: deployment._id }, `Named deployment '${uuid}'`)

    await deployment.populate('model')
    const version = await findVersionById(req.user, (deployment.model as ModelDoc).latestVersion)

    if (!version) {
      throw NotFound(
        { code: 'version_not_found', versionId: (deployment.model as ModelDoc).latestVersion },
        'Unable to find version'
      )
    }

    const managerApproval = await createDeploymentApprovals({
      deployment,
      version,
      user: req.user,
    })

    req.log.info(
      { code: 'created_deployment', deploymentId: deployment._id, approval: managerApproval._id, uuid },
      'Successfully created deployment'
    )

    res.json({
      uuid,
    })
  },
]

export const postUngovernedDeployment = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    req.log.info({ code: 'requesting_deployment' }, 'User requesting deployment')
    const { body } = req

    body.timeStamp = new Date().toISOString()

    const model = await findModelByUuid(req.user, body.modelUuid)

    if (!model) {
      throw NotFound(
        { code: 'model_not_found', modelId: body.modelUuid },
        `Unable to find model with name: '${body.modelUuid}'`
      )
    }

    const name = body.name
      .toLowerCase()
      .replace(/[^a-z 0-9]/g, '')
      .replace(/ /g, '-')

    const uuid = `${name}-${nanoid()}`

    const owner = {
      kind: EntityKind.USER,
      id: req.user.id,
    }

    const deployment = await createDeployment(req.user, {
      schemaRef: null,
      uuid,

      model: model._id,
      metadata: {
        highLevelDetails: {
          name: body.name,
          modelID: model.uuid,
        },
        contacts: {
          owner: [owner],
        },
      },
      managerApproved: ApprovalStates.Accepted,
      ungoverned: true,
    })

    req.log.info(
      { code: 'created_ungoverned_deployment', deploymentId: deployment._id, uuid },
      'Successfully created deployment'
    )

    req.log.info({ code: 'triggered_deployments', deployment }, 'Triggered deployment')
    await requestDeploymentsForModelVersions(req.user, deployment)

    res.json({
      uuid,
    })
  },
]

export const resetDeploymentApprovals = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    const { user } = req
    const { uuid } = req.params
    const deployment = await findDeploymentByUuid(req.user, uuid)
    if (!deployment) {
      throw BadReq({ code: 'deployment_not_found', uuid }, `Unable to find requested deployment: '${uuid}'`)
    }

    if (!(await isUserInEntityList(user, deployment.metadata.contacts.owner))) {
      throw Forbidden(
        { code: 'not_allowed_to_reset_approvals' },
        'You cannot reset the approvals for a deployment you do not own.'
      )
    }

    deployment.managerApproved = ApprovalStates.NoResponse
    await deployment.save()
    req.log.info({ code: 'reset_deployment_approvals', deployment }, 'User resetting deployment approvals')
    const version = await findVersionById(req.user, (deployment.model as ModelDoc).latestVersion)
    if (!version) {
      throw NotFound(
        { code: 'version_not_found', versionId: (deployment.model as ModelDoc).latestVersion },
        'Unable to find version'
      )
    }
    await createDeploymentApprovals({ deployment, version, user: req.user })

    return res.json(deployment)
  },
]

export const fetchRawModelFiles = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    const { uuid, version, fileType } = req.params
    const deployment = await findDeploymentByUuid(req.user, uuid)

    if (deployment === null) {
      throw NotFound({ deploymentUuid: uuid }, `Unable to find deployment for uuid ${uuid}`)
    }

    if (!(await isUserInEntityList(req.user, deployment.metadata.contacts.owner))) {
      const owners = deployment.metadata.contacts.owner.map((owner: any) => owner.id).join(', ')
      throw Unauthorised(
        { deploymentOwner: deployment.metadata.contacts.owner },
        `User is not authorised to download this file. Requester: ${req.user.id}, owners: ${owners}`
      )
    }

    const versionDocument = await findVersionByName(req.user, deployment.model, version)

    if (!versionDocument) {
      throw NotFound({ deployment, version }, `Version ${version} not found for deployment ${deployment.uuid}.`)
    }

    if (deployment.managerApproved !== 'Accepted') {
      throw Unauthorised(
        { approvalStatus: deployment.managerApproved },
        'User is not authorised to download this file as it has not been approved.'
      )
    }

    if (fileType !== 'code' && fileType !== 'binary') {
      throw NotFound({ fileType }, 'Unknown file type specified')
    }

    const bucketName: string = config.minio.buckets.uploads
    const client = getClient()

    let filePath

    if (fileType === 'code') {
      filePath = versionDocument.files.rawCodePath
    } else if (fileType === 'binary') {
      filePath = versionDocument.files.rawBinaryPath
    } else {
      throw BadReq({ fileType }, 'Invalid file type')
    }

    if (!filePath) {
      throw BadReq({}, 'File path not found')
    }

    const { size } = await client.statObject(bucketName, filePath)

    res.set('Content-disposition', `attachment; filename=${fileType}.zip`)
    res.set('Content-Type', 'application/zip')
    res.set('Cache-Control', 'private, max-age=604800, immutable')
    res.set('Content-Length', size.toString())
    res.writeHead(200)

    const stream = await client.getObject(bucketName, filePath)
    if (!stream) {
      throw NotFound({ code: 'object_fetch_failed', bucketName, filePath }, 'Failed to fetch object from storage')
    }
    stream.pipe(res)
  },
]

export const getDeploymentAccess = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { user } = req
    const { uuid } = req.params

    const deployment = await findDeploymentByUuid(req.user, uuid)

    if (deployment === null) {
      throw NotFound({ deploymentUuid: uuid }, `Unable to find deployment for uuid ${uuid}`)
    }

    const owner = await isUserInEntityList(user, deployment.metadata.contacts.owner)

    return res.json({
      owner,
    })
  },
]
