/* eslint-disable no-param-reassign */
import { rm } from 'shelljs'
import tar from 'tar'
import { readFile, stat } from 'fs/promises'
import fs from 'fs'
import config from 'config'
import { join } from 'path'
import defaultAxios, { AxiosInstance } from 'axios'
import { createHash } from 'crypto'
import https from 'https'

import { VersionDoc } from '../../models/Version'
import { BuildOpts, BuildStep, Files } from './BuildStep'
import { BuildLogger } from './BuildLogger'
import { getAccessToken } from '../../routes/v1/registryAuth'
import { ModelDoc } from '../../models/Model'

const CHUNK_SIZE = 8 * 1024 * 1024

export enum ContentTypes {
  APPLICATION_OCTET_STREAM = 'application/octet-stream',
  APPLICATION_MANIFEST = 'application/vnd.docker.distribution.manifest.v2+json',
  APPLICATION_LAYER = 'application/vnd.docker.image.rootfs.diff.tar',
  APPLICATION_CONFIG = 'application/vnd.docker.container.image.v1+json',
}

export type Layer = {
  size: number
  digest: string
  mediaType: ContentTypes
}

export type Manifest = {
  Config: string
  RepoTags: string[]
  Layers: string[]
}

async function getUploadUrl(axios: AxiosInstance, registry: string, image: string) {
  const startUploadUrl = `${registry}/v2/${image}/blobs/uploads/`
  const { location } = (await axios.post(startUploadUrl)).headers

  return `${registry}${location}`
}

async function* readChunks(file: string, chunkSize: number): AsyncIterableIterator<Buffer> {
  const readStream = fs.createReadStream(file, {
    highWaterMark: chunkSize,
  })
  for await (const chunk of readStream) {
    yield chunk
  }
}

async function pushFile(axios: AxiosInstance, registry: string, uploadUrl: string, file: string) {
  const sha256 = createHash('sha256')
  let bytesRead = 0
  let followUploadUrl = uploadUrl
  let chunk
  let headers
  const { size } = await stat(file)

  for await (chunk of readChunks(file, CHUNK_SIZE)) {
    headers = {
      'Content-Type': ContentTypes.APPLICATION_OCTET_STREAM,
      'Content-Length': String(chunk.length),
      'Content-Range': `${bytesRead}-${bytesRead + chunk.length}`,
    }
    bytesRead += chunk.length

    sha256.update(chunk)

    if (bytesRead < size) {
      const { headers: responseHeaders } = await axios.patch(followUploadUrl, chunk, { headers })
      followUploadUrl = `${registry}${responseHeaders.location}`
    }
  }

  // last chunk
  const digest = `sha256:${sha256.digest('hex')}`
  await axios.put(`${followUploadUrl}&digest=${digest}`, chunk, { headers })

  return {
    digest,
    size: bytesRead,
  }
}

class PushDockerTar extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>) {
    super(logger, opts)

    this.opts.retryable = false
  }

  async name() {
    return 'Push Docker Tar'
  }

  async build(version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (!state.dockerPath) {
      throw new Error('Push docker tar requires a docker path')
    }

    const registry = `${config.get('registry.protocol')}://${config.get('registry.host')}`
    const image = `internal/${(version.model as ModelDoc).uuid}`
    const tag = version.version

    const token = await getAccessToken({ id: 'admin', _id: 'admin' }, [
      // we need pull access to finalise layers
      { type: 'repository', name: image, actions: ['pull', 'push'] },
    ])
    const authorisation = `Bearer ${token}`

    const axios = defaultAxios.create({
      maxBodyLength: CHUNK_SIZE,
      maxContentLength: CHUNK_SIZE,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        requestCert: true,
      }),
    })
    axios.defaults.headers.common.Authorization = authorisation

    await tar.extract({
      file: state.dockerPath,
      cwd: state.workingDirectory,
    })

    const rawManifest = await readFile(join(state.workingDirectory, 'manifest.json'), { encoding: 'utf-8' })
    const manifest = JSON.parse(rawManifest)[0] as Manifest

    this.logger.info({ image, tag }, `Pushing ${image}:${tag}`)

    const layers: Array<Layer> = []
    for await (const layer of manifest.Layers) {
      this.logger.info({ layer }, `Uploading layer ${layer}`)
      const uploadUrl = await getUploadUrl(axios, registry, image)

      const path = join(state.workingDirectory, layer)
      const { digest, size } = await pushFile(axios, registry, uploadUrl, path)

      layers.push({
        digest,
        size,
        mediaType: ContentTypes.APPLICATION_LAYER,
      })
    }

    const uploadUrl = await getUploadUrl(axios, registry, image)
    const path = join(state.workingDirectory, manifest.Config)
    const { digest, size } = await pushFile(axios, registry, uploadUrl, path)
    const manifestConfig: Layer = { digest, size, mediaType: ContentTypes.APPLICATION_CONFIG }

    const headers = {
      'Content-Type': ContentTypes.APPLICATION_MANIFEST,
    }
    const url = `${registry}/v2/${image}/manifests/${tag}`
    const registryManifest = {
      config: manifestConfig,
      layers,
      schemaVersion: 2,
      mediaType: ContentTypes.APPLICATION_MANIFEST,
    }

    await axios.put(url, registryManifest, { headers })
    this.logger.info({ image, tag }, `Finished pushing to ${image}:${tag}`)

    // delete old source
    this.logger.info({ ...state }, 'Deleting old docker tar')
    rm(state.dockerPath)
  }

  async rollback(_version: VersionDoc, _files: Files, _state: any): Promise<void> {
    // Nothing to do, working directory is cleared by the
    // CreateWorkingDirectory build step.
  }
}

export default function pushDockerTar(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger) => new PushDockerTar(logger, opts)
}
