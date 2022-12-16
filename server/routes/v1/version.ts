import bodyParser from 'body-parser'
import config from 'config'
import { Request, Response } from 'express'
import RequestModel, { ApprovalTypes } from '../../models/Request'
import { ApprovalStates, ModelUploadType, SeldonVersion } from '../../../types/interfaces'
import { createVersionRequests, deleteRequestsByVersion } from '../../services/request'
import { findVersionById, updateManagerLastViewed, updateReviewerLastViewed } from '../../services/version'
import { BadReq, Forbidden, NotFound } from '../../utils/result'
import { ensureUserRole } from '../../utils/user'
import { isUserInEntityList, parseEntityList } from '../../utils/entity'
import { removeVersionFromModel } from '../../services/model'
import { deleteDeploymentsByVersion } from '../../services/deployment'

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
    const uploadType = metadata.buildOptions.uploadType as ModelUploadType

    if (!version) {
      throw NotFound({ code: 'version_not_found', id }, 'Unable to find version')
    }

    if (!(await isUserInEntityList(req.user, version.metadata.contacts.uploader))) {
      throw Forbidden({ code: 'user_unauthorised' }, 'User is not authorised to do this operation.')
    }

    if (version.managerApproved === ApprovalStates.Accepted && version.reviewerApproved === ApprovalStates.Accepted) {
      throw Forbidden(
        { code: 'user_unauthorised' },
        'User is not able to edit a model if it has already been approved.'
      )
    }

    if (uploadType === ModelUploadType.Zip) {
      const { seldonVersion } = metadata.buildOptions
      const seldonVersionsFromConfig: Array<SeldonVersion> = config.get('uiConfig.seldonVersions')
      if (
        seldonVersionsFromConfig.filter((configSeldonVersion) => configSeldonVersion.image === seldonVersion).length ===
        0
      ) {
        throw BadReq({ seldonVersion }, `Seldon version ${seldonVersion} not recognised`)
      }
    }

    version.metadata = metadata

    const [managers, reviewers] = await Promise.all([
      parseEntityList(version.metadata.contacts.manager),
      parseEntityList(version.metadata.contacts.reviewer),
    ])

    if (!managers.valid) {
      throw BadReq({ managers: version.metadata.contacts.manager }, `Invalid manager: ${managers.reason}`)
    }

    if (!reviewers.valid) {
      throw BadReq({ reviewers: version.metadata.contacts.reviewer }, `Invalid reviewer: '${reviewers.reason}'`)
    }

    await RequestModel.deleteMany({
      version: version._id,
      request: 'Upload',
      $or: [
        {
          approvalType: ApprovalTypes.Manager,
          approvers: { $ne: managers },
        },
        {
          approvalType: ApprovalTypes.Reviewer,
          approvers: { $ne: reviewers },
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

export const postResetVersionApprovals = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { user } = req
    const version = await findVersionById(req.user, id, { populate: true })
    if (!version) {
      throw BadReq({ code: 'version_not_found' }, 'Unable to find requested version')
    }

    if (!(await isUserInEntityList(user, version.metadata.contacts.uploader))) {
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

export const putUpdateLastViewed = [
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

    if (!['manager', 'reviewer'].includes(role)) {
      throw BadReq(
        { code: 'invalid_version_role' },
        'Cannot update last view date as role type specified is not recognised.'
      )
    }

    if (!(await isUserInEntityList(user, version.metadata.contacts[role]))) {
      throw Forbidden({ code: 'user_unauthorised' }, 'User is not authorised to do this operation.')
    }

    if (role === 'manager') {
      await updateManagerLastViewed(id)
      req.log.info(
        { code: 'version_last_viewed_updated', version: id, role },
        "Version's manager last viewed date has been updated"
      )
    } else if (role === 'reviewer') {
      await updateReviewerLastViewed(id)
      req.log.info(
        { code: 'version_last_viewed_updated', version: id, role },
        "Version's reviewer last viewed date has been updated"
      )
    }

    return res.json({ version: id, role })
  },
]

export const deleteVersion = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { user } = req

    const version = await findVersionById(user, id)

    if (!version) {
      throw NotFound({ code: 'version_not_found', id }, `Unable to find version '${id}'`)
    }

    if (!(await isUserInEntityList(user, version.metadata.contacts.uploader))) {
      throw Forbidden({ code: 'user_unauthorised' }, 'User is not authorised to do this operation.')
    }

    await Promise.all([
      deleteRequestsByVersion(user, version),
      deleteDeploymentsByVersion(user, version),
      removeVersionFromModel(user, version),
    ])

    await version.delete(user._id)

    return res.json({ id })
  },
]

export const getVersionAccess = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { user } = req
    const { id } = req.params

    const version = await findVersionById(user, id)

    if (!version) {
      throw NotFound({ code: 'version_not_found', id }, `Unable to find version '${id}'`)
    }

    const [uploader, reviewer, manager] = await Promise.all([
      isUserInEntityList(user, version.metadata.contacts.uploader),
      isUserInEntityList(user, version.metadata.contacts.reviewer),
      isUserInEntityList(user, version.metadata.contacts.manager),
    ])

    return res.json({
      uploader,
      reviewer,
      manager,
    })
  },
]
