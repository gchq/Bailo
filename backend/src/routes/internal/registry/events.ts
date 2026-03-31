import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { z } from '../../../lib/zod.js'
import { ImageRef } from '../../../models/Release.js'
import log from '../../../services/log.js'
import { getModelByIdNoAuth } from '../../../services/model.js'
import { rerunImageScanNoAuth } from '../../../services/scan.js'
import config from '../../../utils/config.js'
import { useTransaction } from '../../../utils/transactions.js'
import { parse } from '../../../utils/validate.js'
import { getAccessToken, softDeletePrefix } from '../../v1/registryAuth.js'

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

    /**
     * Note for developers: registry webhooks are able to trigger before all parts of the resource (e.g. tags)
     * are necessarily finalised/available. Take care to handle this possibility.
     */

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
      if (modelId === softDeletePrefix) {
        log.warn({ event }, 'Ignoring registry push to soft-deleted model')
        continue
      }
      try {
        await getModelByIdNoAuth(modelId)
      } catch (err) {
        log.warn({ event, err }, 'Ignoring registry push to non-existent model')
        continue
      }

      let imageRef: ImageRef | undefined
      if (target?.tag && target?.digest) {
        // Identify by digest as the digest is always available, but tag may not yet be finalised.
        // Still check for tag as we only want to scan the image when the tag is available as the tag
        // is only present when the manifest is pushed (and not when each individual layer is pushed).
        imageRef = { repository: modelId, name, digest: target.digest }
      } else {
        log.warn({ event }, 'Ignoring registry push without tag or digest property')
        continue
      }

      const repositoryToken = await getAccessToken({ dn: config.registry.service }, [
        { type: 'repository', name: `${imageRef.repository}/${imageRef.name}`, actions: ['pull'] },
      ])

      try {
        const status = (
          await useTransaction([(session) => rerunImageScanNoAuth(imageRef, repositoryToken, session)])
        )[0]
        log.debug({ event }, status)
      } catch (err) {
        // Likely triggered by 'No image scanners are enabled.'
        // Only log as `res` has already been returned
        log.error({ event, err }, 'Failed to automatically scan image from the registry')
      }
    }
  },
]
