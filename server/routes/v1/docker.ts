import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

/*
 * Leaving this file here in case we ever want to implement our own
 * Docker registry.  I very much do not though.
 */

function checkAuthorization(req: Request, res: Response, next: NextFunction) {
  if (!req.header('authorization')) {
    res.setHeader('www-authenticate', 'Basic realm=model_store')
    res.status(401)
    return res.json({ errors: [{ code: 'UNAUTHORIZED' }] })
  }

  next()
}

export const getDockerV2 = [
  checkAuthorization,
  async (_req: Request, res: Response) => {
    return res.status(200).json({ supports: true })
  },
]

export const postDockerBlobUpload = [
  checkAuthorization,
  async (req: Request, res: Response) => {
    const { namespace } = req.params
    const { digest } = req.query

    if (digest) {
      throw new Error('digest not implemented')
    }

    console.log('postDockerBlob', namespace, digest)

    res.setHeader('location', `/v2/${namespace}/blobs/uploads/${uuidv4()}`)

    res.setHeader('docker-upload-uuid', 'hello')
    res.status(202)
    res.send()
  },
]

export const postDockerBlobUploadUUID = [
  checkAuthorization,
  async (req: Request, _res: Response) => {
    console.log(req.body)
  },
]

export const headDockerBlobDigest = [
  checkAuthorization,
  async (req: Request, res: Response) => {
    const { namespace, digest } = req.params

    console.log(namespace, digest)

    return res.status(200)
  },
]

export const patchDockerBlobUploadUUID = [
  checkAuthorization,
  async (req: Request, res: Response) => {
    console.log(req.originalUrl)
    console.log(req.headers)

    res.json({})
  },
]
