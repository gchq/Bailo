import config from 'config'
import express from 'express'
import http from 'http'
import next from 'next'
import { createIndexes } from './models/Model'
import { logCreateIndexes } from './models/Log'
import processDeployments from './processors/processDeployments'
import processUploads from './processors/processUploads'
import {
  fetchRawModelFiles,
  getUserDeployments,
  getDeployment,
  postDeployment,
  postUngovernedDeployment,
  resetDeploymentApprovals,
  getDeploymentAccess,
} from './routes/v1/deployment'
import getDocsMenuContent from './routes/v1/docs'
import {
  getModelById,
  getModelByUuid,
  getModelDeployments,
  getModels,
  getModelSchema,
  getModelVersion,
  getModelVersions,
  getModelAccess,
} from './routes/v1/model'
import { getAdminToken, getDockerRegistryAuth } from './routes/v1/registryAuth'
import { getNumApprovals, getApprovals, postApprovalResponse } from './routes/v1/approvals'
import { getDefaultSchema, getSchema, getSchemas, postSchema } from './routes/v1/schema'
import { getSpecification } from './routes/v1/specification'
import { getUiConfig } from './routes/v1/uiConfig'
import { postUpload } from './routes/v1/upload'
import { favouriteModel, getLoggedInUser, getUsers, postRegenerateToken, unfavouriteModel } from './routes/v1/users'
import {
  getVersion,
  getVersionAccess,
  deleteVersion,
  putVersion,
  postResetVersionApprovals,
  putUpdateLastViewed,
  getVersionFileList,
  getVersionFile,
  postRebuildModel,
} from './routes/v1/version'
import { runMigrations, connectToMongoose } from './utils/database'
import { getApplicationLogs, getItemLogs } from './routes/v1/admin'
import logger, { expressErrorHandler, expressLogger } from './utils/logger'
import { ensureBucketExists } from './utils/minio'
import { getUser } from './utils/user'
import { pullBuilderImage } from './utils/build/build'

const port = config.get('listen')
const dev = process.env.NODE_ENV !== 'production'
const app = next({
  dev,
  dir: '.',
})
const handle = app.getRequestHandler()

export const server = express()

// we want to authenticate most requests, so include it here.
// if a user isn't authenticated req.user is undefined, but
// `getUser` still calls next().
server.use(getUser)
server.use(expressLogger)

server.post('/api/v1/model', ...postUpload)

server.get('/api/v1/models', ...getModels)
server.get('/api/v1/model/uuid/:uuid', ...getModelByUuid)
server.get('/api/v1/model/id/:id', ...getModelById)
server.get('/api/v1/model/:uuid/schema', ...getModelSchema)
server.get('/api/v1/model/:uuid/versions', ...getModelVersions)
server.get('/api/v1/model/:uuid/version/:version', ...getModelVersion)
server.get('/api/v1/model/:uuid/deployments', ...getModelDeployments)
server.get('/api/v1/model/:uuid/access', ...getModelAccess)

server.post('/api/v1/deployment', ...postDeployment)
server.post('/api/v1/deployment/ungoverned', ...postUngovernedDeployment)
server.get('/api/v1/deployment/:uuid', ...getDeployment)
server.get('/api/v1/deployment/user/:id', ...getUserDeployments)
server.post('/api/v1/deployment/:uuid/reset-approvals', ...resetDeploymentApprovals)
server.get('/api/v1/deployment/:uuid/version/:version/raw/:fileType', ...fetchRawModelFiles)
server.get('/api/v1/deployment/:uuid/access', ...getDeploymentAccess)

server.get('/api/v1/version/:id', ...getVersion)
server.get('/api/v1/version/:id/contents/:file/list', ...getVersionFileList)
server.get('/api/v1/version/:id/contents/:file', ...getVersionFile)
server.put('/api/v1/version/:id', ...putVersion)
server.get('/api/v1/version/:id/access', ...getVersionAccess)
server.delete('/api/v1/version/:id', ...deleteVersion)
server.post('/api/v1/version/:id/reset-approvals', ...postResetVersionApprovals)
server.post('/api/v1/version/:id/rebuild', ...postRebuildModel)
server.put('/api/v1/version/:id/lastViewed/:role', ...putUpdateLastViewed)

server.get('/api/v1/schemas', ...getSchemas)
server.get('/api/v1/schema/default', ...getDefaultSchema)
server.get('/api/v1/schema/:ref', ...getSchema)
server.post('/api/v1/schema', ...postSchema)

server.get('/api/v1/config', ...getUiConfig)

server.get('/api/v1/users', ...getUsers)
server.get('/api/v1/user', ...getLoggedInUser)
server.post('/api/v1/user/token', ...postRegenerateToken)
server.post('/api/v1/user/favourite/:id', ...favouriteModel)
server.post('/api/v1/user/unfavourite/:id', ...unfavouriteModel)

server.get('/api/v1/approvals', ...getApprovals)
server.get('/api/v1/approvals/count', ...getNumApprovals)
server.post('/api/v1/approval/:id/respond', ...postApprovalResponse)

server.get('/api/v1/registry_auth', ...getDockerRegistryAuth)

server.get('/api/v1/specification', ...getSpecification)

server.get('/api/v1/docs/menu-content', ...getDocsMenuContent)

server.get('/api/v1/admin/logs', ...getApplicationLogs)
server.get('/api/v1/admin/logs/build/:buildId', ...getItemLogs)
server.get('/api/v1/admin/logs/approval/:approvalId', ...getItemLogs)

server.use('/api', expressErrorHandler)

export async function startServer() {
  // technically, we do need to wait for this, but it's so quick
  // that nobody should notice unless they want to upload an image
  // within the first few milliseconds of the _first_ time it's run
  if (config.get('minio.createBuckets')) {
    ensureBucketExists(config.get('minio.uploadBucket'))
    ensureBucketExists(config.get('minio.registryBucket'))
  }

  // connect to mongoose and run migrations
  await connectToMongoose()
  await runMigrations()

  // lazily create indexes for full text search
  createIndexes()
  logCreateIndexes()

  // pull builder image
  pullBuilderImage()

  await Promise.all([app.prepare(), processUploads(), processDeployments()])

  getAdminToken().then((token) => logger.info(`Admin token: ${token}`))

  // handle next requests
  server.use((req, res) => handle(req, res))

  http.createServer(server).listen(port)
  logger.info({ port }, `Listening on port ${port}`)
}

if (require.main === module) {
  startServer()
}
