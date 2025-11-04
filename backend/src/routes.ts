import bodyParser from 'body-parser'
import express from 'express'
import path from 'path'
import swaggerUi from 'swagger-ui-express'
import { fileURLToPath } from 'url'

import authentication from './connectors/authentication/index.js'
import { expressLogger } from './routes/middleware/expressLogger.js'
import { requestId } from './routes/middleware/requestId.js'
import v1Router from './routes/v1/routes.js'
import v2Router from './routes/v2/routes.js'
import { generateSwaggerSpec } from './services/specification.js'

export const server = express()

server.use(requestId, bodyParser.json(), expressLogger)
const middlewareConfigs = authentication.authenticationMiddleware()
for (const middlewareConf of middlewareConfigs) {
  server.use(middlewareConf?.path || '/', middlewareConf.middleware)
}

server.use('/api/v2/docs', swaggerUi.serve, swaggerUi.setup(generateSwaggerSpec()))

server.use('/api/v1', v1Router)
server.use('/api/v2', v2Router)

// Python docs
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
server.use('/docs/python', express.static(path.join(__dirname, '../python-docs/dirhtml')))
