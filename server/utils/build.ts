import { mkdir, exec, rm } from 'shelljs'
import { HydratedDocument } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { writeFile } from 'fs/promises'
import { createReadStream } from 'fs'
import { getClient } from './minio'
import unzip from 'unzipper'
import config from 'config'
import dedent from 'dedent-js'
import logger from './logger'
import { getAdminToken } from '../routes/v1/registryAuth'
import { env } from 'process'
import { OpenshiftClient } from 'openshift-rest-client'
import AdmZip from 'adm-zip'

interface FileRef {
  path: string
  bucket: string
  name: string
}

interface BuilderFiles {
  binary: FileRef
  code: FileRef
}

export async function pullBuilderImage() {
  if (env.OPENSHIFT) {
    logger.info('Running in OpenShift, so not pulling base image')
  } else {
    await logCommand(`img pull ${config.get('s2i.builderImage')}`, (level: string, message: string) =>
      logger[level](message)
    )
  }
}

async function createWorkingDirectory(): Promise<string> {
  const directory = join(tmpdir(), uuidv4())
  await mkdir(directory)

  return directory
}

async function downloadFile(remote: FileRef, local: string) {
  const minio = getClient()
  await minio.fGetObject(remote.bucket, remote.path, local)
}

async function deleteMinioFile(remote: FileRef) {
  const minio = getClient()
  await minio.removeObject(remote.bucket, remote.path)
}

async function unzipFile(zipPath: string) {
  const outputDir = dirname(zipPath)

  await unzip.Open.file(zipPath).then((d) => d.extract({ path: outputDir, concurrency: 5 }))
}

export async function logCommand(command: string, log: Function) {
  log('info', `$ ${command}`)

  return await runCommand(
    command,
    (data: string) => data.split(/\r?\n/).map((msg: string) => log('info', msg)),
    (data: string) => data.split(/\r?\n/).map((msg: string) => log('error', msg))
  )
}

export async function runCommand(command: string, onStdout: Function, onStderr: Function, opts: any = {}) {
  const childProcess = exec(command, { async: true, silent: true })
  childProcess.stdout!.on('data', (data) => {
    onStdout(data.trim())
  })

  childProcess.stderr!.on('data', (data) => {
    onStderr(data.trim())
  })

  await new Promise((resolve, reject) => {
    childProcess.on('exit', () => {
      if (childProcess.exitCode !== 0 && !opts.silentErrors) {
        return reject(
          `Failed with status code '${childProcess.exitCode}'${opts.hide ? '' : ` when running '${command}'`}`
        )
      }

      resolve({})
    })
  })
}

export async function buildPython(version: HydratedDocument<any>, builderFiles: BuilderFiles): Promise<string> {
  const vlog = logger.child({ versionId: version._id })
  const tmpDir = await createWorkingDirectory()

  // zip paths
  const binaryPath = join(tmpDir, 'binary.zip')
  const codePath = join(tmpDir, 'code.zip')

  // download code bundles
  vlog.info({ builderFiles }, 'Downloading code bundles')
  await Promise.all([downloadFile(builderFiles.binary, binaryPath), downloadFile(builderFiles.code, codePath)])

  // unzip both files
  vlog.info({ binaryPath, codePath }, 'Unzipping files')
  await Promise.all([unzipFile(binaryPath), unzipFile(codePath)])

  // remove zip files
  vlog.info({ binaryPath, codePath }, 'Removing temp files')
  rm(binaryPath, codePath)

  // add metadata
  vlog.info('Adding in model environment data')
  const modelEnvs = dedent(`
    MODEL_NAME=Model
    API_TYPE=REST
    SERVICE_TYPE=MODEL
    PERSISTENCE=0
    PIP_NO_CACHE_DIR=off
    INCLUDE_METRICS_IN_CLIENT_RESPONSE=false
  `)

  const s2iDir = join(tmpDir, '.s2i')
  mkdir('-p', s2iDir)
  await writeFile(join(s2iDir, 'environment'), modelEnvs)

  // make Dockerfile
  const builder = config.get('s2i.builderImage')
  const builderScriptsUrl = '/s2i/bin'
  const buildDir = await createWorkingDirectory()
  const buildDockerfile = join(buildDir, 'Dockerfile')
  const tag = `${config.get('registry.host')}/internal/${version.model.uuid}:${version.version}`
  const toDockerfileTags = `--copy --as-dockerfile ${buildDockerfile} --scripts-url image://${builderScriptsUrl} --assemble-user root`
  const command = `${config.get('s2i.path')} build ${tmpDir} ${builder} ${toDockerfileTags}`
  vlog.info({ builder, tag, command }, 'Making Dockerfile')
  await logCommand(command, version.log.bind(version))

  // build image
  if (env.OPENSHIFT) {
    vlog.info('Running in openshift. In process of using rest api to build')
    const client = await OpenshiftClient()

    const namespace = `${config.get('openshift.namespace')}`
    const dockerPushSecretName = `${config.get('openshift.dockerPushSecretName')}`
    const registryUrl = `${config.get('openshift.appPublicRoute')}`

    // see if docker push secret already exists
    try {
      const existingSecrets = await client.api.v1.ns(namespace).secret(dockerPushSecretName).get()
      logger.info(`docker config secret ${dockerPushSecretName} already exists. No need to create`)
    } catch (error) {
      // need to create new secret
      const token = await getAdminToken()
      const creds = `admin:${token}`
      const b64Cred = Buffer.from(creds).toString('base64')

      const dockerConfig = {
        auths: {
          [registryUrl]: {
            auth: b64Cred,
          },
        },
      }

      const dockerSecret = {
        kind: 'Secret',
        apiVersion: 'v1',
        metadata: {
          name: dockerPushSecretName,
        },
        data: {
          '.dockerconfigjson': Buffer.from(JSON.stringify(dockerConfig)).toString('base64'),
        },
        type: 'kubernetes.io/dockerconfigjson',
      }
      const createSecret = await client.api.v1.ns('bailo').secret.post({ body: dockerSecret })
      logger.info(createSecret.statusCode)
      logger.info(createSecret.body)
      // TODO add secret to openshift builder service account (currently done via OS console)
    }
    const buildConfigName = `${version.model.uuid}-${version.version}`
    let buildConfig = {
      kind: 'BuildConfig',
      apiVersion: 'build.openshift.io/v1',
      metadata: {
        name: buildConfigName,
      },
      spec: {
        triggers: [
          {
            type: 'GitHub',
            github: {
              secret: 'notreallyvalid',
            },
          },
        ],
        runPolicy: 'Serial',
        source: {
          type: 'Binary',
          binary: {},
        },
        strategy: {
          type: 'Docker',
          dockerStrategy: {},
        },
        output: {
          to: {
            kind: 'DockerImage',
            name: `${registryUrl}/internal/${version.model.uuid}:${version.version}`,
          },
          pushSecret: {
            name: `${dockerPushSecretName}`,
          },
        },
        resources: {},
        postCommit: {},
        nodeSelector: null,
        successfulBuildsHistoryLimit: 5,
        failedBuildsHistoryLimit: 5,
      },
    }

    try {
      const bc = await client.apis['build.openshift.io'].v1.namespaces(namespace).buildconfigs(buildConfigName).get()
      logger.info(`buildConfig ${buildConfigName} already exists. Not creating.`)
    } catch (error) {
      //need to create the build config
      let bc_create = await client.apis['build.openshift.io'].v1
        .namespaces(namespace)
        .buildconfigs.post({ body: buildConfig })
      logger.info(bc_create.statusCode)
      logger.info(bc_create.body)
    }

    const zipFile = `${buildDir}.zip`
    const zip = new AdmZip()
    zip.addLocalFolder(`${buildDir}`)
    await zip.writeZip(zipFile)

    const binaryResponse = await client.apis.build.v1
      .ns(namespace)
      .buildconfigs(buildConfigName)
      .instantiatebinary.post({ body: createReadStream(zipFile), json: false })
    logger.info(binaryResponse.statusCode)
    logger.info(binaryResponse.body)
    const buildName = JSON.parse(binaryResponse.body).metadata.name
    let curBuild = await client.apis.build.v1.ns(namespace).builds(buildName).get()
    logger.info(curBuild.statusCode)
    logger.info(curBuild.body)
    let buildJson = curBuild.body
    if (typeof buildJson === 'string') {
      buildJson = JSON.parse(buildJson)
    }
    logger.info(buildJson)
    while (['Running', 'New'].includes(buildJson.status.phase)) {
      logger.info('Waiting for build to finish')
      await new Promise((r) => setTimeout(r, 10000))
      curBuild = await client.apis.build.v1.ns(namespace).builds(buildName).get()
      logger.info(curBuild.statusCode)
      logger.info(curBuild.body)
      buildJson = curBuild.body
      if (typeof buildJson === 'string') {
        buildJson = JSON.parse(buildJson)
      }
    }
    let buildLog = await client.apis.build.v1.ns(namespace).builds(buildName).log.get()
    version.log('info', buildLog.body)
    // TODO delete new buildConfig on success -- uncomment after confirming buildConfig
    // created as expected
    // logger.info(`Deleting build config ${buildName}`)
    // const delete_bc = await client.apis['build.openshift.io'].v1.namespaces(
    //   namespace).buildconfigs(buildConfig.metadata.name).delete()
    // logger.info(delete_bc.statusCode)
    // logger.info(delete_bc.body)
  } else {
    const buildCommand = `img build -f ${buildDockerfile} -t ${tag} ${buildDir}`
    vlog.info({ buildCommand }, 'Building')
    await logCommand(buildCommand, version.log.bind(version))

    // push image
    vlog.info({ tag }, 'Pushing image to docker')
    version.log('info', 'Logging into docker')
    // using docker instead of img login because img reads from ~/.docker/config and
    // does not fully populate authorization headers (clientId and account) in authorization
    // requests like docker does. docker login doesn't require docker to be running in host
    await runCommand(
      `docker login ${config.get('registry.host')} -u admin -p ${await getAdminToken()}`,
      vlog.info.bind(vlog),
      vlog.error.bind(vlog),
      { hide: true }
    )
    version.log('info', 'Successfully logged into docker')

    await logCommand(`img push ${tag}`, version.log.bind(version))

    // tidy up
    vlog.info({ tmpDir, builderFiles, s2iDir }, 'Removing temp directories and Minio uploads')
    rm('-rf', tmpDir)
    rm('-rf', buildDir)
    rm('-rf', s2iDir)

    await Promise.all([deleteMinioFile(builderFiles.binary), deleteMinioFile(builderFiles.code)])
    const removeImageCmd = `img rm ${tag}`
    await logCommand(removeImageCmd, (level: string, message: string) => logger[level](message))
  }
  return tag
}
