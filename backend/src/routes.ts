import parser from 'body-parser'
import MongoStore from 'connect-mongo'
import express from 'express'
import session from 'express-session'
import grant from 'grant'

import { getApplicationLogs, getItemLogs } from './routes/v1/admin.js'
import { getApprovals, getNumApprovals, postApprovalResponse } from './routes/v1/approvals.js'
import {
  fetchRawModelFiles,
  getDeployment,
  getDeploymentAccess,
  getExportModelVersion,
  getUserDeployments,
  postDeployment,
  postUngovernedDeployment,
  resetDeploymentApprovals,
} from './routes/v1/deployment.js'
import {
  getModelAccess,
  getModelById,
  getModelByUuid,
  getModelDeployments,
  getModels,
  getModelSchema,
  getModelVersion,
  getModelVersions,
} from './routes/v1/model.js'
import { getDockerRegistryAuth } from './routes/v1/registryAuth.js'
import { getDefaultSchema, getSchema, getSchemas, postSchema } from './routes/v1/schema.js'
import { getSpecification } from './routes/v1/specification.js'
import { getUiConfig } from './routes/v1/uiConfig.js'
import { postUpload } from './routes/v1/upload.js'
import { favouriteModel, getLoggedInUser, getUsers, postRegenerateToken, unfavouriteModel } from './routes/v1/users.js'
import {
  deleteVersion,
  getVersion,
  getVersionAccess,
  getVersionFile,
  getVersionFileList,
  postRebuildModel,
  postResetVersionApprovals,
  putUpdateLastViewed,
  putVersion,
} from './routes/v1/version.js'
import config from './utils/config.js'
import { expressErrorHandler, expressLogger } from './utils/logger.js'
import { getUser } from './utils/user.js'

export const server = express()

if (config.oauth.enabled) {
  server.use(
    session({
      secret: config.session.secret,
      resave: true,
      saveUninitialized: true,
      cookie: { maxAge: 30 * 24 * 60 * 60000 }, // store for 30 days
      store: MongoStore.create({
        mongoUrl: config.mongo.uri,
      }),
    })
  )
}

server.use(getUser)
server.use(expressLogger)

if (config.oauth.enabled) {
  server.use(parser.urlencoded({ extended: true }))
  server.use(grant.default.express(config.oauth.grant))

  server.get('/api/login', (req, res) => {
    res.redirect(`/api/connect/${config.oauth.provider}/login`)
  })

  server.get('/api/logout', (req, res) => {
    req.session.destroy(function (err) {
      res.redirect('/')
    })
  })
}

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
server.get('/api/v1/deployment/:uuid/access', ...getDeploymentAccess)
server.get('/api/v1/deployment/:uuid/version/:version/raw/:fileType', ...fetchRawModelFiles)
server.get('/api/v1/deployment/:uuid/version/:version/export', ...getExportModelVersion)

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

server.get('/api/v1/config/ui', ...getUiConfig)

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

server.get('/api/v1/admin/logs', ...getApplicationLogs)
server.get('/api/v1/admin/logs/build/:buildId', ...getItemLogs)
server.get('/api/v1/admin/logs/approval/:approvalId', ...getItemLogs)

server.use('/api', expressErrorHandler)
