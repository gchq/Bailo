import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { startUploadMultipartFile } from '../../../../services/file.js'
import { coerceArray, parse } from '../../../../utils/validate.js'

export const postStartMultipartUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    name: z.string(),
    mime: z.string().optional().default('application/octet-stream'),
    size: z.number().positive(),
    tags: coerceArray(z.array(z.string()).optional()),
  }),
})

export interface PresignedChunk {
  presignedUrl: string
  startByte: number
  endByte: number
}

interface PostStartMultipartUpload {
  fileId: string
  chunks: Array<PresignedChunk>
}

export const postStartMultipartUpload = [
  async (req: Request, res: Response<PostStartMultipartUpload>): Promise<void> => {
    req.audit = AuditInfo.CreateFile
    // Does user have permission to upload a file?
    const {
      params: { modelId },
      body: { name, mime, size, tags },
    } = parse(req, postStartMultipartUploadSchema)

    const { file, chunks } = await startUploadMultipartFile(req.user, modelId, name, mime, size, tags)
    await audit.onCreateFile(req, file)

    res.json({
      fileId: file.id,
      chunks,
    })
  },
]
