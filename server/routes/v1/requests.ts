import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { DeploymentDoc } from '../../models/Deployment'
import { ApprovalStates } from '../../../types/interfaces'
import { RequestTypes } from '../../models/Request'
import { VersionDoc } from '../../models/Version'
import { findDeploymentById } from '../../services/deployment'
import { getRequest, readNumRequests, readRequests } from '../../services/request'
import { getUserByInternalId } from '../../services/user'
import { findVersionById } from '../../services/version'
import { reviewedRequest } from '../../templates/reviewedRequest'
import { getDeploymentQueue } from '../../utils/queues'
import { BadReq, Unauthorised } from '../../utils/result'
import { sendEmail } from '../../utils/smtp'
import { ensureUserRole, hasRole } from '../../utils/user'
import { isUserInEntityList } from '../../utils/entity'

export const getRequests = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const type = req.query.type as string
    const filter = req.query.filter as string

    if (!['Upload', 'Deployment'].includes(type)) {
      return res.error(400, [
        { code: 'invalid_object_type', received: type },
        `Expected 'Upload' / 'Deployment', received '${type}'`,
      ])
    }

    if (filter === 'all') {
      if (!hasRole(['admin'], req.user)) {
        return res.error(401, [
          { code: 'unauthorised_admin_role_missing', roles: req.user.roles },
          'Forbidden.  Your user does not have the "admin" role',
        ])
      }
    } else {
      req.log.info('Getting requests for user')
    }

    const requests = await readRequests({
      type: type as RequestTypes,
      filter: filter === 'all' ? undefined : req.user._id,
      archived: filter === 'archived',
    })

    req.log.info({ code: 'fetching_requests', requests }, 'User fetching requests')
    return res.json({
      requests,
    })
  },
]

export const getNumRequests = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const requests = await readNumRequests({
      userId: req.user._id,
    })

    req.log.info({ code: 'fetching_request_count', requestCount: requests }, 'Fetching the number of requests')
    return res.json({
      count: requests,
    })
  },
]

export const postRequestResponse = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const choice = req.body.choice as string

    const request = await getRequest({ requestId: id })

    if (!(await isUserInEntityList(req.user, request.approvers)) && !hasRole(['admin'], req.user)) {
      throw Unauthorised(
        { code: 'unauthorised_to_approve', requestId: id, userId: req.user._id, requestApprovers: request.approvers },
        'You do not have permissions to approve this'
      )
    }

    if (!['Accepted', 'Declined'].includes(choice)) {
      throw BadReq(
        { code: 'invalid_request_choice', choice, requestId: id },
        `Received invalid request choice, received '${choice}'`
      )
    }

    request.status = choice as ApprovalStates
    await request.save()

    let field
    if (request.approvalType === 'Manager') {
      field = 'managerApproved'
    } else {
      field = 'reviewerApproved'
    }

    let userId: Types.ObjectId
    let requestType: RequestTypes
    let document: VersionDoc | DeploymentDoc

    if (request.version) {
      const versionDoc = request.version as VersionDoc
      const version = await findVersionById(req.user, versionDoc._id, { populate: true })
      if (!version) {
        throw BadReq(
          { code: 'version_not_found', version: versionDoc._id },
          `Received invalid version '${versionDoc._id}'`
        )
      }

      userId = req.user._id
      requestType = RequestTypes.Upload
      document = version

      version[field] = choice
      await version.save()
    } else if (request.deployment) {
      const deploymentDoc = request.deployment as DeploymentDoc
      const deployment = await findDeploymentById(req.user, deploymentDoc._id, { populate: true })
      if (!deployment) {
        throw BadReq(
          { code: 'deployment_not_found', deployment: deploymentDoc },
          `Received invalid deployment '${deploymentDoc._id}'`
        )
      }

      userId = req.user._id
      requestType = RequestTypes.Deployment
      document = deployment

      deployment[field] = choice

      await deployment.save()

      if (choice === 'Accepted') {
        // run deployment
        req.log.info({ code: 'triggered_deployments', deployment }, 'Triggered deployment')
        await (
          await getDeploymentQueue()
        ).add({
          deploymentId: deployment._id,
          userId,
        })
      }
    } else {
      throw BadReq({ code: 'bad_request_type', requestId: request._id }, 'Unable to determine request type')
    }

    const reviewingUser = req.user.id
    const user = await getUserByInternalId(userId)
    if (user?.email) {
      await sendEmail({
        to: user.email,
        ...reviewedRequest({
          document,
          choice,
          requestType,
          reviewingUser,
        }),
      })
    }

    req.log.info({ code: 'approval_response_set', requestId: id, choice }, 'Successfully set approval response')

    res.json({
      message: 'Finished setting approval response',
    })
  },
]
