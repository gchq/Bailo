import bodyParser from 'body-parser'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import path from 'path'
import swaggerUi from 'swagger-ui-express'
import { fileURLToPath } from 'url'

import authentication from './connectors/authentication/index.js'
import internalRouter from './routes/internal/routes.js'
import { expressErrorHandler } from './routes/middleware/expressErrorHandler.js'
import v1Router from './routes/v1/routes.js'
import v2Router from './routes/v2/routes.js'
import v3Router from './routes/v3/routes.js'
import { httpLog } from './services/log.js'

export const server = express()

server.use([
  bodyParser.json(),
  httpLog,
  helmet(),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  }),
])
const middlewareConfigs = authentication.authenticationMiddleware()
for (const middlewareConf of middlewareConfigs) {
  server.use(middlewareConf?.path || '/', middlewareConf.middleware)
}

server.use('/api/v1', v1Router)
server.use('/api/v2', v2Router)
server.use('/api/v3', v3Router)
server.use('/internal', internalRouter)

server.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    swaggerOptions: {
      urls: [
        {
          url: '/api/v2/api-docs/swagger.json',
          name: 'v2.0.0',
        },
        {
          url: '/api/v3/api-docs/swagger.json',
          name: 'v3.0.0(beta)',
        },
      ],
    },
  }),
)

// Python docs
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
server.use('/docs/python', express.static(path.join(__dirname, '../python-docs/dirhtml')))

server.use(expressErrorHandler)
