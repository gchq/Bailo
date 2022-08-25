import express from 'express'
import next from 'next'
import http from 'http'
import config from 'config'
import processUploads from './processors/processUploads'
import {
  getModelByUuid,
  getModelById,
  getModelDeployments,
  getModels,
  getModelSchema,
  getModelVersion,
  getModelVersions,
} from './routes/v1/model'
import { postUpload } from './routes/v1/upload'
import { getUiConfig } from './routes/v1/uiConfig'
import { connectToMongoose } from './utils/database'
import { ensureBucketExists } from './utils/minio'
import { getDefaultSchema, getSchema, getSchemas } from './routes/v1/schema'
import { getVersion, putVersion, resetVersionApprovals } from './routes/v1/version'
import {
  getDeployment,
  getCurrentUserDeployments,
  postDeployment,
  resetDeploymentApprovals,
} from './routes/v1/deployment'
import { getDockerRegistryAuth } from './routes/v1/registryAuth'
import processDeployments from './processors/processDeployments'
import { getUsers, getLoggedInUser, postRegenerateToken, favouriteModel, unfavouriteModel } from './routes/v1/users'
import { getUser } from './utils/user'
import { getNumRequests, getRequests, postRequestResponse } from './routes/v1/requests'
import logger, { expressErrorHandler, expressLogger } from './utils/logger'
import { createIndexes } from './models/Model'
import { getSpecification } from './routes/v1/specification'
import getDocsMenuContent from './routes/v1/docs'

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

server.post('/api/v1/deployment', ...postDeployment)
server.get('/api/v1/deployment/:uuid', ...getDeployment)
server.get('/api/v1/deployment/user/:id', ...getCurrentUserDeployments)
server.post('/api/v1/deployment/:uuid/reset-approvals', ...resetDeploymentApprovals)

server.get('/api/v1/version/:id', ...getVersion)
server.put('/api/v1/version/:id', ...putVersion)
server.post('/api/v1/version/:id/reset-approvals', ...resetVersionApprovals)

server.get('/api/v1/schemas', ...getSchemas)
server.get('/api/v1/schema/default', ...getDefaultSchema)
server.get('/api/v1/schema/:ref', ...getSchema)

server.get('/api/v1/config', ...getUiConfig)
server.get('/api/v1/users', ...getUsers)
server.get('/api/v1/user', ...getLoggedInUser)
server.post('/api/v1/user/token', ...postRegenerateToken)
server.post('/api/v1/user/favourite/:id', ...favouriteModel)
server.post('/api/v1/user/unfavourite/:id', ...unfavouriteModel)

server.get('/api/v1/requests', ...getRequests)
server.get('/api/v1/requests/count', ...getNumRequests)
server.post('/api/v1/request/:id/respond', ...postRequestResponse)

server.get('/api/v1/registry_auth', ...getDockerRegistryAuth)

server.get('/api/v1/specification', ...getSpecification)

server.get('/api/v1/docs/menu-content', ...getDocsMenuContent)

server.use('/api', expressErrorHandler)

export async function startServer() {
  // technically, we do need to wait for this, but it's so quick
  // that nobody should notice unless they want to upload an image
  // within the first few milliseconds of the _first_ time it's run
  ensureBucketExists(config.get('minio.uploadBucket'))
  ensureBucketExists(config.get('minio.registryBucket'))

  // we don't actually need to wait for mongoose to connect before
  // we start serving connections
  connectToMongoose()

  // lazily create indexes for full text search
  createIndexes()

  await Promise.all([app.prepare(), processUploads(), processDeployments()])

  server.use((req, res) => handle(req, res))

  http.createServer(server).listen(port)
  logger.info({ port }, `Listening on port ${port}`)
}

if (require.main === module) {
  startServer()
}
