import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { z } from '../../../lib/zod.js'
import log from '../../../services/log.js'
import { getModelByIdNoAuth } from '../../../services/model.js'
import { rerunImageScanNoAuth } from '../../../services/scan.js'
import config from '../../../utils/config.js'
import { parse } from '../../../utils/validate.js'
import { getAccessToken } from '../../v1/registryAuth.js'

export const registryEventsSchema = z.object({
  body: z.object({
    events: z.array(
      z.object({
        id: z.string(),
        timestamp: z.string().datetime(),
        action: z.string(),
        target: z
          .object({
            mediaType: z.string().optional(),
            size: z.number().int().nonnegative().optional(),
            digest: z.string().optional(),
            length: z.number().int().nonnegative().optional(),
            repository: z.string().optional(),
            url: z.string().optional(),
            tag: z.string().optional(),
          })
          .optional(),
        request: z
          .object({
            id: z.string().optional(),
            addr: z.string().optional(),
            host: z.string().optional(),
            method: z.string().optional(),
            useragent: z.string().optional(),
          })
          .optional(),
        actor: z.object({ name: z.string().optional() }).optional(),
        source: z
          .object({
            addr: z.string().optional(),
            instanceID: z.string().optional(),
          })
          .optional(),
      }),
    ),
  }),
})

export const handleRegistryEvents = [
  bodyParser.json({ type: ['application/vnd.docker.distribution.events.v2+json'] }),
  async (req: Request, res: Response<void>): Promise<void> => {
    const {
      body: { events },
    } = parse(req, registryEventsSchema)

    // registry only stops sending events when we return, so return early and only log errors
    res.json()

    for (const event of events) {
      if (event?.action !== 'push') {
        log.info({ event }, 'Ignoring registry event for non-push action')
        continue
      }

      const target = event.target
      if (!target) {
        log.warn({ event }, 'Ignoring registry push without target property')
        continue
      }
      const repository = target?.repository
      if (!repository || !repository.includes('/')) {
        log.warn({ event }, 'Ignoring registry push for invalid repository name')
        continue
      }

      const [modelId, ...rest] = repository.split('/')
      const name = rest.join('/')
      const model = getModelByIdNoAuth(modelId)
      if (!model) {
        log.warn({ event }, 'Ignoring registry push to non-existent model')
        continue
      }

      const tag = target?.tag
      if (!tag) {
        log.warn({ event }, 'Ignoring registry push without tag property')
        continue
      }

      const imageRef = { repository: modelId, name, tag }
      const repositoryToken = await getAccessToken({ dn: config.registry.service }, [
        { type: 'repository', name: `${imageRef.repository}/${imageRef.name}`, actions: ['pull'] },
      ])

      try {
        const status = await rerunImageScanNoAuth(imageRef, repositoryToken)
        log.debug({ event }, status)
      } catch (err) {
        // Likely triggered by 'No image scanners are enabled.'
        // Only log as `res` has already been returned
        log.error({ event, err }, 'Failed to automatically scan image from the registry')
      }
    }
  },
]
