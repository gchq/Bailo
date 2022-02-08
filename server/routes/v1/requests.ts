import { Request, Response } from 'express'
import bodyParser from 'body-parser'
import { Document } from 'mongoose'
import { ensureUserRole, hasRole } from '../../utils/user'
import VersionModel from '../../models/Version'
import DeploymentModel from '../../models/Deployment'

import { deploymentQueue } from '../../utils/queues'
import { getRequest, readNumRequests, readRequests, RequestType } from '../../services/request'
import { RequestStatusType } from '../../../types/interfaces'
import { ObjectId } from 'mongoose'
import UserModel from '../../models/User'
import { BadReq, Unauthorised } from '../../utils/result'
import { reviewedRequest } from '../../templates/reviewedRequest'
import { sendEmail } from '../../utils/smtp'

export const getRequests = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const type = req.query.type as string
    const filter = req.query.filter as string

    if (!['Upload', 'Deployment'].includes(type)) {
      return res.error(400, [{ received: type }, `Expected 'Upload' / 'Deployment', received '${type}'`])
    }

    if (filter === 'all') {
      if (!hasRole(['admin'], req.user!)) {
        return res.error(401, [{ roles: req.user?.roles }, 'Forbidden.  Your user does not have the "admin" role'])
      }
    } else {
      req.log.info('Getting requests for user')
    }

    const requests = await readRequests({
      type: type as RequestType,
      filter: filter === 'all' ? undefined : req.user!._id,
    })

    return res.json({
      requests,
    })
  },
]

export const getNumRequests = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const requests = await readNumRequests({
      userId: req.user!._id,
    })

    return res.json({
      count: requests,
    })
  },
]

export const postRequestResponse = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    const id = req.params.id
    const choice = req.body.choice as string

    const request = await getRequest({ requestId: id })

    if (!req.user!._id.equals(request.user) && !hasRole(['admin'], req.user!)) {
      throw Unauthorised(
        { id, userId: req.user?._id, requestUser: request.user },
        'You do not have permissions to approve this'
      )
    }

    if (!['Accepted', 'Declined'].includes(choice)) {
      throw BadReq({ choice }, `Received invalid request choice, received '${choice}'`)
    }

    request.status = choice as RequestStatusType
    await request.save()

    let field
    if (request.approvalType === 'Manager') {
      field = 'managerApproved'
    } else {
      field = 'reviewerApproved'
    }

    let userId: ObjectId
    let requestType: RequestType
    let document: Document & { model: any; uuid: string }
    if (request.version) {
      const version = await VersionModel.findById(request.version).populate('model')
      userId = version.model.owner
      requestType = 'Upload'
      document = version

      version[field] = choice
      await version.save()
    } else if (request.deployment) {
      const deployment = await DeploymentModel.findById(request.deployment).populate('model')
      userId = deployment.model.owner
      requestType = 'Deployment'
      document = deployment

      deployment[field] = choice

      await deployment.save()

      if (choice === 'Accepted') {
        // run deployment
        req.log.info({ deploymentId: deployment._id }, 'Triggered deployment')
        const job = await deploymentQueue
          .createJob({
            deploymentId: deployment._id,
          })
          .timeout(60000)
          .retries(2)
          .save()
      }
    } else {
      throw BadReq({ requestId: request._id }, 'Unable to determine request type')
    }

    const user = await UserModel.findById(userId)
    if (user.email) {
      await sendEmail({
        to: user.email,
        ...reviewedRequest({
          document,
          choice,
          requestType,
        }),
      })
    }

    req.log.info({ id, choice }, 'Successfully set approval response')

    res.json({
      message: 'Finished setting approval response',
    })
  },
]
