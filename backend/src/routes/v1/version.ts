import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { basename } from 'path'

import audit from '../../external/Audit.js'
import ApprovalModel from '../../models/Approval.js'
import ModelModel from '../../models/Model.js'
import { createVersionApprovals, deleteApprovalsByVersion } from '../../services/approval.js'
import { emailDeploymentOwnersOnVersionDeletion, findDeploymentsByModel } from '../../services/deployment.js'
import { removeVersionFromModel } from '../../services/model.js'
import {
  findVersionById,
  findVersionFileList,
  updateManagerLastViewed,
  updateReviewerLastViewed,
} from '../../services/version.js'
import { ApprovalStates, ApprovalTypes, ModelUploadType, SeldonVersion } from '../../types/types.js'
import { FileRef } from '../../utils/build/build.js'
import config from '../../utils/config.js'
import { isUserInEntityList, parseEntityList } from '../../utils/entity.js'
import { getClient } from '../../utils/minio.js'
import { getUploadQueue } from '../../utils/queues.js'
import { BadReq, Forbidden, NotFound } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'
import { getFileStream, MinioRandomAccessReader } from '../../utils/zip.js'

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

export const getVersionFileList = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id, file } = req.params

    if (file !== 'code') {
      throw BadReq({ file }, 'Only code listing is supported.')
    }

    const version = await findVersionById(req.user, id, { showFiles: true })

    if (!version) {
      throw NotFound({ code: 'version_not_found', versionId: id }, 'Unable to find version')
    }

    const fileList = await findVersionFileList(version)

    return res.json({
      fileList,
    })
  },
]

export const getVersionFile = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id, file } = req.params
    const { path } = req.query

    if (typeof path !== 'string') {
      throw BadReq({ path }, 'Path should be of type string.')
    }

    if (file !== 'code') {
      throw BadReq({ file }, 'Only code listing is supported.')
    }

    const version = await findVersionById(req.user, id, { showFiles: true })

    if (!version) {
      throw NotFound({ code: 'version_not_found', versionId: id }, 'Unable to find version')
    }

    if (!version.files.rawCodePath) {
      throw NotFound({ code: 'version_not_found', versionId: id }, 'Unable to find version code path')
    }

    const fileList = await findVersionFileList(version)
    const entry = fileList.find((item) => item.fileName === path)

    if (!entry) {
      throw NotFound({ code: 'version_not_found', versionId: id, path }, 'Unable to find version file')
    }

    const fileRef: FileRef = {
      bucket: config.minio.buckets.uploads,
      path: version.files.rawCodePath,
      name: basename(path),
    }

    const minio = getClient()
    const reader = new MinioRandomAccessReader(minio, fileRef)
    const stream = await getFileStream(reader, entry)

    stream.pipe(res)
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

    if (uploadType === ModelUploadType.Zip) {
      const { seldonVersion } = metadata.buildOptions
      const seldonVersionsFromConfig: Array<SeldonVersion> = config.ui.seldonVersions
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

    await ApprovalModel.deleteMany({
      version: version._id,
      approvalCategory: 'Upload',
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

    await createVersionApprovals({ version, user: req.user })

    version.managerApproved = ApprovalStates.NoResponse
    version.reviewerApproved = ApprovalStates.NoResponse
    await version.save()

    req.log.info({ code: 'updating_version', version }, 'User updating version')
    await audit.onModelVersionUpdate(version)
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
      throw BadReq({ code: 'version_not_found', version: id }, 'Unable to find requested version')
    }

    if (!(await isUserInEntityList(user, version.metadata.contacts.uploader))) {
      throw Forbidden(
        { code: 'user_unauthorised', version: version._id },
        'User is not authorised to do this operation.'
      )
    }
    version.managerApproved = ApprovalStates.NoResponse
    version.reviewerApproved = ApprovalStates.NoResponse
    await version.save()
    await createVersionApprovals({ version, user: req.user })

    req.log.info({ code: 'version_approvals_reset', version: version._id }, 'User reset version approvals')
    return res.json(version)
  },
]

export const postRebuildModel = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { user } = req
    const version = await findVersionById(req.user, id, { populate: true })
    if (!version) {
      throw BadReq({ code: 'version_not_found', version: id }, 'Unable to find requested version')
    }

    if (!(await isUserInEntityList(user, version.metadata.contacts.uploader))) {
      throw Forbidden(
        { code: 'user_unauthorised', version: version._id },
        'User is not authorised to do this operation.'
      )
    }

    const uploadType = version.metadata?.buildOptions?.uploadType
    if (!uploadType || ![ModelUploadType.Zip, ModelUploadType.Docker].includes(uploadType)) {
      throw BadReq({ version: version._id }, 'Unable to rebuild a model that was not uploaded as a binary file')
    }

    if (version.state.build.state === 'retrying') {
      throw BadReq({ version: version._id }, 'This model is already being rebuilt automatically.')
    }

    const binaryRef = {
      name: 'binary.zip',
      bucket: config.minio.buckets.uploads,
      path: version.files.rawBinaryPath,
    }

    const codeRef = {
      name: 'code.zip',
      bucket: config.minio.buckets.uploads,
      path: version.files.rawCodePath,
    }

    const jobId = await (
      await getUploadQueue()
    ).add({
      versionId: version._id,
      userId: req.user._id,
      binary: binaryRef,
      code: codeRef,
      uploadType: ModelUploadType.Zip,
    })

    version.state.build = {
      ...(version.state.build || {}),
      state: 'retrying',
    }
    version.markModified('state')
    await version.save()

    const message = 'Successfully created build job in upload queue'
    req.log.info({ code: 'created_upload_job', jobId, version: version._id }, message)
    return res.json({
      message,
    })
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

    const model = await ModelModel.findById(version.model)

    if (!model) {
      throw NotFound({ code: 'model_not_found', modelId: version.model }, `Unable to find model '${version.model}'`)
    }

    if (!(await isUserInEntityList(user, version.metadata.contacts.uploader))) {
      throw Forbidden({ code: 'user_unauthorised' }, 'User is not authorised to do this operation.')
    }

    await Promise.all([deleteApprovalsByVersion(user, version), removeVersionFromModel(user, version)])

    await version.delete(user._id)

    const deployments = await findDeploymentsByModel(user, model)
    if (deployments.length > 0) {
      // Send email to owners of affected deployments
      await emailDeploymentOwnersOnVersionDeletion(deployments, version)
    }

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
