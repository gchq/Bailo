import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import ModelModel from '../../models/Model.js'
import {
  getApproval,
  readApprovals,
  readNumApprovals,
  requestDeploymentsForModelVersions,
} from '../../services/approval.js'
import {
  findDeploymentById,
  findDeploymentsByModel,
  removeModelDeploymentsFromRegistry,
} from '../../services/deployment.js'
import { findVersionById } from '../../services/version.js'
import { reviewedApproval } from '../../templates/reviewedApproval.js'
import { ApprovalCategory, ApprovalStates, DeploymentDoc, Entity, ModelDoc, VersionDoc } from '../../types/types.js'
import { getUserListFromEntityList, isUserInEntityList } from '../../utils/entity.js'
import { getDeploymentQueue } from '../../utils/queues.js'
import { BadReq, Forbidden } from '../../utils/result.js'
import { sendEmail } from '../../utils/smtp.js'
import { ensureUserRole, hasRole } from '../../utils/user.js'

export const getApprovals = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const approvalCategory = req.query.approvalCategory as string
    const filter = req.query.filter as string

    if (!['Upload', 'Deployment'].includes(approvalCategory)) {
      return res.error(400, [
        { code: 'invalid_object_type', received: approvalCategory },
        `Expected 'Upload' / 'Deployment', received '${approvalCategory}'`,
      ])
    }

    if (filter === 'all') {
      if (!hasRole(['admin'], req.user)) {
        throw Forbidden(
          { code: 'unauthorised_admin_role_missing', roles: req.user.roles },
          'Forbidden.  Your user does not have the "admin" role'
        )
      }
    } else {
      req.log.info({ code: 'fetching_user_approvals' }, 'Getting approvals for user')
    }

    const approvals = await readApprovals({
      approvalCategory: approvalCategory as ApprovalCategory,
      filter: filter === 'all' ? undefined : req.user._id,
      archived: filter === 'archived',
    })

    req.log.info({ code: 'fetching_approvals', approvals }, 'User fetching approvals')
    return res.json({
      approvals,
    })
  },
]

export const getNumApprovals = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const approvals = await readNumApprovals({
      userId: req.user._id,
    })

    req.log.info({ code: 'fetching_approval_count', approvalCount: approvals }, 'Fetching the number of approvals')
    return res.json({
      count: approvals,
    })
  },
]

export const postApprovalResponse = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const choice = req.body.choice as string

    const approval = await getApproval({ approvalId: id })

    if (!(await isUserInEntityList(req.user, approval.approvers)) && !hasRole(['admin'], req.user)) {
      throw Forbidden(
        {
          code: 'unauthorised_to_approve',
          approvalId: id,
          userId: req.user._id,
          approvalApprovers: approval.approvers,
        },
        'You do not have permissions to approve this'
      )
    }

    if (!['Accepted', 'Declined'].includes(choice)) {
      throw BadReq(
        { code: 'invalid_approval_choice', choice, approvalId: id },
        `Received invalid approval choice, received '${choice}'`
      )
    }

    approval.status = choice as ApprovalStates
    await approval.save()

    let field: 'managerApproved' | 'reviewerApproved'
    if (approval.approvalType === 'Manager') {
      field = 'managerApproved'
    } else {
      field = 'reviewerApproved'
    }

    let entities: Array<Entity>
    let approvalCategory: ApprovalCategory
    let document: VersionDoc | DeploymentDoc

    if (approval.version) {
      const versionDoc = approval.version as VersionDoc
      const version = await findVersionById(req.user, versionDoc._id, { populate: true })
      if (!version) {
        throw BadReq(
          { code: 'version_not_found', version: versionDoc._id },
          `Received invalid version '${versionDoc._id}'`
        )
      }

      entities = version.metadata.contacts.uploader
      approvalCategory = ApprovalCategory.Upload
      document = version

      version[field] = choice as ApprovalStates
      await version.save()

      if (version.managerApproved === ApprovalStates.Accepted && version.reviewerApproved === ApprovalStates.Accepted) {
        const deployments = await findDeploymentsByModel(req.user, version.model as ModelDoc)
        deployments.forEach(async (deployment) => {
          if (deployment.managerApproved === ApprovalStates.Accepted) {
            await (
              await getDeploymentQueue()
            ).add({
              deploymentId: deployment._id,
              userId: req.user._id,
              version: version.version,
            })
          }
        })
      }
    } else if (approval.deployment) {
      const deploymentId = approval.deployment
      const deployment = await findDeploymentById(req.user, deploymentId, { populate: true })
      if (!deployment) {
        throw BadReq(
          { code: 'deployment_not_found', deployment: deploymentId },
          `Received invalid deployment '${deploymentId}'`
        )
      }

      entities = deployment.metadata.contacts.owner
      approvalCategory = ApprovalCategory.Deployment
      document = deployment

      if (field === 'reviewerApproved') {
        throw BadReq({}, 'Cannot set reviewer on deployment')
      }

      deployment[field] = choice as ApprovalStates

      await deployment.save()

      if (choice === ApprovalStates.Accepted) {
        await requestDeploymentsForModelVersions(req.user, deployment)
      } else if (choice === ApprovalStates.Declined) {
        const model = await ModelModel.findById(deployment.model)
        if (!model) {
          throw BadReq({ code: 'bad_request_type', deployment }, 'Unable to find model for deployment')
        }
        await removeModelDeploymentsFromRegistry(model, deployment)
      }
    } else {
      throw BadReq({ code: 'bad_approval_category', approvalId: approval._id }, 'Unable to determine approval category')
    }

    const reviewingUser = req.user.id
    const userList = await getUserListFromEntityList(entities)

    if (userList.length > 20) {
      // refusing to send more than 20 emails.
      req.log.warn({ count: userList.length, approval: approval._id }, 'Refusing to send too many emails')
      return
    }

    for (const user of userList) {
      if (!user.email) {
        continue
      }
      await sendEmail({
        to: user.email,
        ...(await reviewedApproval({
          document,
          choice,
          approvalCategory,
          reviewingUser,
        })),
      })
    }

    req.log.info({ code: 'approval_response_set', approvalId: id, choice }, 'Successfully set approval response')

    res.json({
      message: 'Finished setting approval response',
    })
  },
]
