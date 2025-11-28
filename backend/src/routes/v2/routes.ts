import { Router } from 'express'
import { match } from 'path-to-regexp'

import config from '../../utils/config.js'
import { AllowList, entryKindCheck } from '../middleware/entryType.js'
import { expressErrorHandler } from '../middleware/expressErrorHandler.js'
import { getCurrentUser } from './entities/getCurrentUser.js'
import { getEntities } from './entities/getEntities.js'
import { getEntityLookup } from './entities/getEntityLookup.js'
import { getFilescanningInfo } from './filescanning/getFilescanningInfo.js'
import { putFileScan } from './filescanning/putFileScan.js'
import { deleteAccessRequest } from './model/accessRequest/deleteAccessRequest.js'
import { getAccessRequest } from './model/accessRequest/getAccessRequest.js'
import { getAccessRequestCurrentUserPermissions } from './model/accessRequest/getAccessRequestCurrentUserPermissions.js'
import { getModelAccessRequests } from './model/accessRequest/getModelAccessRequests.js'
import { patchAccessRequest } from './model/accessRequest/patchAccessRequest.js'
import { postAccessRequest } from './model/accessRequest/postAccessRequest.js'
import { postAccessRequestComment } from './model/accessRequest/postAccessRequestComment.js'
import { deleteFile } from './model/file/deleteFile.js'
import { getDownloadFile } from './model/file/getDownloadFile.js'
import { getFiles } from './model/file/getFiles.js'
import { patchFile } from './model/file/patchFile.js'
import { postFinishMultipartUpload } from './model/file/postFinishMultipartUpload.js'
import { postSimpleUpload } from './model/file/postSimpleUpload.js'
import { postStartMultipartUpload } from './model/file/postStartMultipartUpload.js'
import { getModel } from './model/getModel.js'
import { getModelCurrentUserPermissions } from './model/getModelCurrentUserPermissions.js'
import { getModelsSearch } from './model/getModelsSearch.js'
import { getImages } from './model/images/getImages.js'
import { deleteInference } from './model/inferencing/deleteInferenceService.js'
import { getInference } from './model/inferencing/getInferenceService.js'
import { getInferences } from './model/inferencing/getInferenceServices.js'
import { postInference } from './model/inferencing/postInferenceService.js'
import { putInference } from './model/inferencing/putInferenceService.js'
import { getModelCard } from './model/modelcard/getModelCard.js'
import { getModelCardHtml } from './model/modelcard/getModelCardHtml.js'
import { getModelCardRevisions } from './model/modelcard/getModelCardRevisions.js'
import { postFromSchema } from './model/modelcard/postFromSchema.js'
import { postFromTemplate } from './model/modelcard/postFromTemplate.js'
import { putModelCard } from './model/modelcard/putModelCard.js'
import { patchModel } from './model/patchModel.js'
import { postModel } from './model/postModel.js'
import { postRequestExportToS3 } from './model/postRequestExport.js'
import { postRequestImportFromS3 } from './model/postRequestImport.js'
import { getModelRoles } from './model/roles/getModelRoles.js'
import { deleteWebhook } from './model/webhook/deleteWebhook.js'
import { getWebhooks } from './model/webhook/getWebhooks.js'
import { postWebhook } from './model/webhook/postWebhook.js'
import { putWebhook } from './model/webhook/putWebhook.js'
import { deleteRelease } from './release/deleteRelease.js'
import { getRelease } from './release/getRelease.js'
import { getReleases } from './release/getReleases.js'
import { postRelease } from './release/postRelease.js'
import { postReleaseComment } from './release/postReleaseComment.js'
import { putRelease } from './release/putRelease.js'
import { getResponses } from './response/getResponses.js'
import { patchResponse } from './response/patchResponse.js'
import { patchResponseReaction } from './response/patchResponseReaction.js'
import { deleteReviewRole } from './review/deleteReviewRole.js'
import { getReviewRoles } from './review/getReviewRoles.js'
import { getReviews } from './review/getReviews.js'
import { postAccessRequestReviewResponse } from './review/postAccessRequestReviewResponse.js'
import { postReleaseReviewResponse } from './review/postReleaseReviewResponse.js'
import { postReviewRole } from './review/postReviewRole.js'
import { putReviewRole } from './review/putReviewRole.js'
import { deleteSchema } from './schema/deleteSchema.js'
import { getSchema } from './schema/getSchema.js'
import { getSchemaMigrations } from './schema/getSchemaMigrations.js'
import { getSchemas } from './schema/getSchemas.js'
import { patchSchema } from './schema/patchSchema.js'
import { postSchema } from './schema/postSchema.js'
import { postSchemaMigration } from './schema/postSchemaMigration.js'
import { getSpecification } from './specification.js'
import { getPeerStatus } from './system/peers.js'
import { getSystemStatus } from './system/status.js'
import { getUiConfig } from './uiConfig/getUiConfig.js'
import { deleteUserToken } from './user/deleteUserToken.js'
import { getUserTokenList } from './user/getUserTokenList.js'
import { getUserTokens } from './user/getUserTokens.js'
import { postUserToken } from './user/postUserToken.js'

const router = Router()

const entryAllowList: {
  model: AllowList
  'data-card': AllowList
  mirroredModel: AllowList
} = {
  model: { allowAll: true },
  'data-card': {
    allow: [
      { url: match('/'), method: ['GET', 'patch'] },
      { url: match('/permissions/mine'), method: ['GET'] },
    ],
  },
  mirroredModel: {
    allow: [
      { url: match('/'), method: ['GET', 'patch'] },
      {
        url: (input) => /\/*/.test(input),
        method: ['GET'],
      },
    ],
  },
}

router.use('/model/:modelId', entryKindCheck(entryAllowList))

router.get('/system/status', ...getSystemStatus)
router.get('/system/peers', ...getPeerStatus)

router.post('/models', ...postModel)
router.get('/models/search', ...getModelsSearch)

router.get('/model/:modelId', ...getModel)
router.patch('/model/:modelId', ...patchModel)

router.post('/model/:modelId/export/s3', ...postRequestExportToS3)
router.post('/model/import/s3', ...postRequestImportFromS3)

router.get('/model/:modelId/model-card/:version', ...getModelCard)
router.get('/model/:modelId/model-card/:version/html', ...getModelCardHtml)
router.get('/model/:modelId/model-card-revisions', ...getModelCardRevisions)
router.put('/model/:modelId/model-cards', ...putModelCard)
router.post('/model/:modelId/setup/from-template', ...postFromTemplate)
router.post('/model/:modelId/setup/from-schema', ...postFromSchema)

router.post('/model/:modelId/releases', ...postRelease)
router.get('/model/:modelId/releases', ...getReleases)
router.get('/model/:modelId/release/:semver', ...getRelease)
router.get('/model/:modelId/release/:semver/file/:fileName/download', ...getDownloadFile)
// This is a temporary workaround to split out the URL to disable authorisation.
router.get('/token/model/:modelId/release/:semver/file/:fileName/download', ...getDownloadFile)
router.put('/model/:modelId/release/:semver', ...putRelease)
router.post('/model/:modelId/release/:semver/comment', ...postReleaseComment)
router.delete('/model/:modelId/release/:semver', ...deleteRelease)
router.post('/model/:modelId/release/:semver/review', ...postReleaseReviewResponse)

router.post('/model/:modelId/access-requests', ...postAccessRequest)
router.get('/model/:modelId/access-requests', getModelAccessRequests)
router.get('/model/:modelId/access-request/:accessRequestId', ...getAccessRequest)
router.delete('/model/:modelId/access-request/:accessRequestId', ...deleteAccessRequest)
router.patch('/model/:modelId/access-request/:accessRequestId', ...patchAccessRequest)
router.post('/model/:modelId/access-request/:accessRequestId/comment', ...postAccessRequestComment)
router.post('/model/:modelId/access-request/:accessRequestId/review', ...postAccessRequestReviewResponse)
router.get(
  '/model/:modelId/access-request/:accessRequestId/permissions/mine',
  ...getAccessRequestCurrentUserPermissions,
)

router.get('/model/:modelId/files', ...getFiles)
router.get('/model/:modelId/file/:fileId/download', ...getDownloadFile)
// This is a temporary workaround to split out the URL to disable authorisation.
router.get('/token/model/:modelId/file/:fileId/download', ...getDownloadFile)
router.post('/model/:modelId/files/upload/simple', ...postSimpleUpload)
router.post('/model/:modelId/files/upload/multipart/start', ...postStartMultipartUpload)
router.post('/model/:modelId/files/upload/multipart/finish', ...postFinishMultipartUpload)
router.delete('/model/:modelId/file/:fileId', ...deleteFile)
router.patch('/model/:modelId/file/:fileId', ...patchFile)

router.post('/model/:modelId/webhooks', ...postWebhook)
router.get('/model/:modelId/webhooks', ...getWebhooks)
router.put('/model/:modelId/webhook/:webhookId', ...putWebhook)
router.delete('/model/:modelId/webhook/:webhookId', ...deleteWebhook)

router.get('/model/:modelId/images', ...getImages)
router.get('/model/:modelId/files', ...getFiles)
router.get('/model/:modelId/file/:fileId/download', ...getDownloadFile)
// This is a temporary workaround to split out the URL to disable authorisation.
router.get('/token/model/:modelId/file/:fileId/download', ...getDownloadFile)
router.post('/model/:modelId/files/upload/simple', ...postSimpleUpload)
router.post('/model/:modelId/files/upload/multipart/start', ...postStartMultipartUpload)
router.post('/model/:modelId/files/upload/multipart/finish', ...postFinishMultipartUpload)
router.delete('/model/:modelId/file/:fileId', ...deleteFile)

// Inferencing routes are conditional to Bailo specific configuration
// NOTE: Enabled if config not loaded for testing purposes
if (!config.ui?.inference || config.ui.inference?.enabled) {
  router.get('/model/:modelId/inferences', ...getInferences)
  router.get('/model/:modelId/inference/:image/:tag', ...getInference)
  router.post('/model/:modelId/inference', ...postInference)
  router.put('/model/:modelId/inference/:image/:tag', ...putInference)
  router.delete('/model/:modelId/inference/:image/:tag', ...deleteInference)
}

router.get('/schemas', ...getSchemas)
router.get('/schema/:schemaId', ...getSchema)
router.post('/schemas', ...postSchema)
router.patch('/schema/:schemaId', ...patchSchema)
router.delete('/schema/:schemaId', ...deleteSchema)

router.get('/schema-migrations', ...getSchemaMigrations)
router.post('/schema-migration', ...postSchemaMigration)

router.get('/reviews', ...getReviews)
router.get('/responses', ...getResponses)
router.patch('/response/:responseId', ...patchResponse)
router.patch('/response/:responseId/reaction/:kind', ...patchResponseReaction)

router.get('/roles', ...getModelRoles)
router.get('/model/:modelId/permissions/mine', ...getModelCurrentUserPermissions)

router.get('/entities', ...getEntities)
router.get('/entities/me', ...getCurrentUser)
router.get('/entity/:dn/lookup', ...getEntityLookup)

router.get('/config/ui', ...getUiConfig)

router.post('/user/tokens', ...postUserToken)
router.get('/user/tokens', ...getUserTokens)
router.get('/user/tokens/list', ...getUserTokenList)
router.delete('/user/token/:accessKey', ...deleteUserToken)

router.get('/specification', ...getSpecification)

router.get('/filescanning/info', ...getFilescanningInfo)
router.put('/filescanning/model/:modelId/file/:fileId/scan', ...putFileScan)

router.get('/review/roles', ...getReviewRoles)
router.delete('/review/role/:reviewRoleShortName', ...deleteReviewRole)
router.post('/review/role', ...postReviewRole)
router.put('/review/role/:shortName', ...putReviewRole)

router.use(expressErrorHandler)

export default router
