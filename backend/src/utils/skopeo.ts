import { Access, getAccessToken } from '../routes/registryAuth.js'
import { runCommand } from './build/build.js'
import config from './config.js'

export interface ImageRef {
  namespace: string
  model: string
  version: string
}

type LogFunction = (level: 'info' | 'error', msg: string) => void

export async function getAdminAuthorisation(scope: Array<Access>): Promise<string> {
  return getAccessToken({ id: 'admin', _id: 'admin' }, scope)
}

export function getDockerPath(image: ImageRef) {
  return `${config.registry.connection.host}/${image.namespace}/${image.model}:${image.version}`
}

export async function copyDockerImage(src: ImageRef, dest: ImageRef, log: LogFunction) {
  const srcToken = await getAdminAuthorisation([
    { type: 'repository', name: `${src.namespace}/${src.model}`, actions: ['pull'] },
  ])

  const destToken = await getAdminAuthorisation([
    { type: 'repository', name: `${dest.namespace}/${dest.model}`, actions: ['push', 'pull'] },
  ])

  return runCommand(
    `skopeo copy --src-registry-token ${srcToken} --dest-registry-token ${destToken} docker://${getDockerPath(
      src,
    )} docker://${getDockerPath(dest)}`,
    (msg) => log('info', msg),
    (msg) => log('error', msg),
  )
}

export async function downloadDockerExport(src: ImageRef, filepath: string, log: LogFunction) {
  const srcToken = await getAdminAuthorisation([
    { type: 'repository', name: `${src.namespace}/${src.model}`, actions: ['pull'] },
  ])

  const dest = `docker-archive:${filepath}.tar:${getDockerPath(src)}`
  await runCommand(
    `skopeo copy --src-registry-token ${srcToken} docker://${getDockerPath(src)} ${dest}`,
    (msg) => log('info', msg),
    (msg) => log('error', msg),
  )

  await runCommand(
    `gzip --fast ${filepath}.tar`,
    (msg) => log('info', msg),
    (msg) => log('error', msg),
  )
}

export async function uploadDockerExport(filepath: string, dest: ImageRef, log: LogFunction) {
  const token = await getAdminAuthorisation([
    { type: 'repository', name: `${dest.namespace}/${dest.model}`, actions: ['pull', 'push'] },
  ])

  await runCommand(
    `skopeo copy --dest-registry-token ${token} docker-archive:${filepath} docker://${getDockerPath(dest)}`,
    (msg) => log('info', msg),
    (msg) => log('error', msg),
  )
}

export async function deleteImageTag(image: ImageRef, log: LogFunction) {
  const token = await getAdminAuthorisation([
    { type: 'repository', name: `${image.namespace}/${image.model}`, actions: ['pull', 'delete'] },
  ])

  return runCommand(
    `skopeo delete --registry-token ${token} docker://${getDockerPath(image)}`,
    (msg) => log('info', msg),
    (msg) => log('error', msg),
  )
}
