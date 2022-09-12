import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import RequestModel, { ApprovalTypes, RequestDoc } from '../../models/Request'
import { ApprovalStates } from '../../models/Deployment'
import { createVersionRequests } from '../../services/request'
import { findVersionById } from '../../services/version'
import { BadReq, Forbidden, NotFound } from '../../utils/result'
import { ensureUserRole } from '../../utils/user'
import { VersionDoc } from 'server/models/Version'
import { getUserById } from 'server/services/user'

export const getVersion = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params

    const version = await findVersionById(req.user!, id)

    if (!version) {
      throw NotFound({ code: 'version_not_found', versionId: id }, 'Unable to find version')
    }

    req.log.info({ code: 'fetching_version', version }, 'User fetching version')
    return res.json(version)
  },
]

export const putVersion = [
  ensureUserRole('user'),
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true }),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const metadata = req.body

    const version = await findVersionById(req.user!, id, { populate: true })

    if (!version) {
      throw NotFound({ code: 'version_not_found', id: id }, 'Unable to find version')
    }

    if (req.user?.id !== version.metadata.contacts.uploader) {
      throw Forbidden({ code: 'user_unauthorised' }, 'User is not authorised to do this operation.')
    }

    const oldContacts = version.metadata.contacts
    version.metadata = metadata

    const [manager, reviewer] = await Promise.all([
      getUserById(version.metadata.contacts.manager),
      getUserById(version.metadata.contacts.reviewer),
    ])

    await RequestModel.remove({
      version: version._id,
      request: 'Upload',
      $or: [
        { $or: [
          { approvalType: ApprovalTypes.Manager, user: { $ne: manager } },
          { approvalType: ApprovalTypes.Reviewer, user: { $ne: reviewer } }
        ]},
        { approvalType: { $ne: ApprovalStates.NoResponse }}
      ]
    })

    /*if (
      version.metadata.contacts.manager !== oldContacts.manager ||
      version.managerApproved !== ApprovalStates.NoResponse
    ) {
      const existingManagerRequest = await RequestModel.findOne({
        version: version._id,
        request: 'Upload',
        approvalType: ApprovalTypes.Manager,
      })
      existingManagerRequest !== null && existingManagerRequest.delete()
    }
    if (
      version.metadata.contacts.reviewer !== oldContacts.reviewer ||
      version.reviewerApproved !== ApprovalStates.NoResponse
    ) {
      const existingMReviewerRequest = await RequestModel.findOne({
        version: version._id,
        request: 'Upload',
        approvalType: ApprovalTypes.Reviewer,
      })
      existingMReviewerRequest !== null && existingMReviewerRequest.delete()
    }*/

    await createVersionRequests({ version })

    version.managerApproved = ApprovalStates.NoResponse
    version.reviewerApproved = ApprovalStates.NoResponse
    await version.save()

    req.log.info({ code: 'updating_version', version }, 'User updating version')
    return res.json(version)
  },
]

export const resetVersionApprovals = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const user = req.user
    const version = await findVersionById(req.user!, id, { populate: true })
    if (!version) {
      throw BadReq({ code: 'version_not_found' }, 'Unabled to find version for requested deployment')
    }
    if (user?.id !== version.metadata.contacts.uploader) {
      throw Forbidden({ code: 'user_unauthorised' }, 'User is not authorised to do this operation.')
    }
    version.managerApproved = ApprovalStates.NoResponse
    version.reviewerApproved = ApprovalStates.NoResponse
    await version.save()
    await createVersionRequests({ version })

    req.log.info({ code: 'version_approvals_reset', version }, 'User reset version approvals')
    return res.json(version)
  },
]
