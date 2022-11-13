import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import RequestModel, { ApprovalTypes } from '../../models/Request'
import { ApprovalStates } from '../../../types/interfaces'
import { createVersionRequests } from '../../services/request'
import { findVersionById, updateManagerLastViewed, updateReviewerLastViewed } from '../../services/version'
import { BadReq, Forbidden, NotFound } from '../../utils/result'
import { ensureUserRole } from '../../utils/user'
import { getUserById } from '../../services/user'

export const getVersion = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { logs } = req.query
    const showLogs = logs === 'true'

    const version = await findVersionById(req.user, id, { showLogs })

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

    const version = await findVersionById(req.user, id, { populate: true })

    if (!version) {
      throw NotFound({ code: 'version_not_found', id }, 'Unable to find version')
    }

    if (req.user.id !== version.metadata.contacts.uploader) {
      throw Forbidden({ code: 'user_unauthorised' }, 'User is not authorised to do this operation.')
    }

    if (version.managerApproved === ApprovalStates.Accepted && version.reviewerApproved === ApprovalStates.Accepted) {
      throw Forbidden(
        { code: 'user_unauthorised' },
        'User is not able to edit a model if it has already been approved.'
      )
    }

    version.metadata = metadata

    const [manager, reviewer] = await Promise.all([
      getUserById(version.metadata.contacts.manager),
      getUserById(version.metadata.contacts.reviewer),
    ])

    await RequestModel.deleteMany({
      version: version._id,
      request: 'Upload',
      $or: [
        {
          approvalType: ApprovalTypes.Manager,
          user: { $ne: manager },
        },
        {
          approvalType: ApprovalTypes.Reviewer,
          user: { $ne: reviewer },
        },
        {
          status: { $in: [ApprovalStates.Accepted, ApprovalStates.Declined] },
        },
      ],
    })

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
    const { user } = req
    const version = await findVersionById(req.user, id, { populate: true })
    if (!version) {
      throw BadReq({ code: 'version_not_found' }, 'Unable to find requested version')
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

export const updateLastViewed = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id, role } = req.params
    const { user } = req
    if (!user) {
      throw Forbidden({ code: 'user_unauthorised' }, 'Not user details found in request.')
    }
    const version = await findVersionById(user, id, { populate: true })
    if (!version) {
      throw BadReq({ code: 'version_not_found' }, 'Unable to find requested version')
    }
    if (user.id !== version.metadata.contacts[role]) {
      throw Forbidden({ code: 'user_unauthorised' }, 'User is not authorised to do this operation.')
    }
    if (role === 'manager') {
      updateManagerLastViewed(id)
      req.log.info(
        { code: 'version_last_viewed_updated', version: id, role },
        "Version's manager last viewed date has been updated"
      )
    } else if (role === 'reviewer') {
      updateReviewerLastViewed(id)
      req.log.info(
        { code: 'version_last_viewed_updated', version: id, role },
        "Version's reviewer last viewed date has been updated"
      )
    } else {
      throw BadReq(
        { code: 'invalid_version_role' },
        'Cannot update last view date as role type specified is not recognised.'
      )
    }
    return res.json({ version: id, role })
  },
]
