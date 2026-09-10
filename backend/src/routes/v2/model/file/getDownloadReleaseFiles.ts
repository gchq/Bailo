import path from 'node:path'
import { PassThrough, pipeline as pipelineCallback, Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import zlib from 'node:zlib'

import { create } from 'content-disposition'
import { Request, Response } from 'express'
import { Pack, pack } from 'tar-stream'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { type FileWithScanResultsAggregate } from '../../../../models/File.js'
import { authoriseFileDownloads, downloadFile, getFilesByIds } from '../../../../services/file.js'
import log from '../../../../services/log.js'
import { getReleaseBySemver } from '../../../../services/release.js'
import { registerPath } from '../../../../services/specification.js'
import { HttpHeader } from '../../../../types/enums.js'
import { BailoError } from '../../../../types/error.js'
import { Forbidden } from '../../../../utils/error.js'
import { parse } from '../../../../utils/validate.js'

const cacheControl = 'no-store'
const archiveContentType = 'application/gzip'

const paramsSchema = z.object({
  modelId: z.string(),
  semver: z.string(),
})

export const getDownloadReleaseFilesSchema = z.object({ params: paramsSchema })

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/release/{semver}/files/download',
  tags: ['file'],
  description: 'Download all files associated with a release as a streamed tar.gz archive.',
  schema: getDownloadReleaseFilesSchema,
  responses: {
    200: {
      description: 'A tar.gz archive containing all files associated with the release.',
      content: {
        [archiveContentType]: {
          schema: z.string().openapi({ format: 'binary' }),
        },
      },
    },
  },
})

type TarEntrySink = ReturnType<Pack['entry']>

function asNodeReadable(stream: Pack): Readable {
  return stream as unknown as Readable
}

function asNodeWritable(stream: TarEntrySink): Writable {
  return stream as unknown as Writable
}

function createArchiveEntryName(file: FileWithScanResultsAggregate, usedNames: Set<string>) {
  const baseName = path.posix.basename(file.name.replaceAll('\\', '/')) || file.id
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName)
    return baseName
  }

  const parsed = path.posix.parse(baseName)
  let suffix = 2
  let candidate = `${parsed.name}-${suffix}${parsed.ext}`
  while (usedNames.has(candidate)) {
    suffix += 1
    candidate = `${parsed.name}-${suffix}${parsed.ext}`
  }
  usedNames.add(candidate)
  return candidate
}

function createArchiveStream(user: Request['user'], files: FileWithScanResultsAggregate[]) {
  const tarStream = pack()
  const gzipStream = zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED })
  const output = new PassThrough()
  const usedNames = new Set<string>()

  void pipeline(asNodeReadable(tarStream), gzipStream, output).catch((error) => {
    output.destroy(error as Error)
  })

  void (async () => {
    try {
      for (const file of files) {
        const fileStream = await downloadFile(user, file.id)
        const entry = tarStream.entry({
          name: createArchiveEntryName(file, usedNames),
          size: file.size,
          mode: 0o644,
          type: 'file',
        })
        await pipeline(fileStream, asNodeWritable(entry))
      }
      tarStream.finalize()
    } catch (error) {
      tarStream.destroy(error as Error)
      output.destroy(error as Error)
    }
  })()

  return output
}

export const getDownloadReleaseFiles = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.ViewFile
    const {
      params: { modelId, semver },
    } = parse(req, getDownloadReleaseFilesSchema)

    const release = await getReleaseBySemver(req.user, modelId, semver)
    const files = await getFilesByIds(req.user, modelId, release.fileIds)

    if (files.length !== release.fileIds.length) {
      throw Forbidden('You do not have permission to download every file in this release.', {
        userDn: req.user.dn,
        modelId,
        semver,
      })
    }

    await authoriseFileDownloads(req.user, modelId, files)
    for (const file of files) {
      await audit.onViewFile(req, file)
    }

    const stream = createArchiveStream(req.user, files)
    let headersCommitted = false

    stream.once('error', (err: unknown) => {
      const error: BailoError = {
        code: 500,
        name: 'Release archive download error',
        message: 'Error occurred whilst streaming release archive',
        status: 500,
        cause: err instanceof Error ? err.message : String(err),
        context: { modelId, semver },
      }

      if (!headersCommitted && !res.headersSent) {
        res.status(500).json(error)
      } else {
        res.destroy(err as Error)
      }
      log.error({ error })
    })

    stream.once('readable', () => {
      if (headersCommitted) {
        return
      }
      headersCommitted = true
      res.set(HttpHeader.CONTENT_DISPOSITION, create(`${modelId}-${semver}.tar.gz`, { type: 'attachment' }))
      res.set(HttpHeader.CONTENT_TYPE, archiveContentType)
      res.set(HttpHeader.CACHE_CONTROL, cacheControl)
      res.status(200)
    })

    res.once('close', () => {
      if (!stream.readableEnded && !stream.destroyed) {
        stream.destroy()
      }
    })

    pipelineCallback(stream, res, () => {
      /* NOOP: stream errors are handled above. */
    })
  },
]
