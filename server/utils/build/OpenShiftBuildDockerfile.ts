/* eslint-disable no-param-reassign */
import config from 'config'
import { OpenshiftClient } from 'openshift-rest-client'
import AdmZip from 'adm-zip'
import { createReadStream } from 'fs'

import { VersionDoc } from '../../models/Version'
import { BuildOpts, BuildStep, Files } from './BuildStep'
import { BuildLogger } from './BuildLogger'
import { ModelDoc } from '../../models/Model'
import { getAdminToken } from '../../routes/v1/registryAuth'

class OpenShiftBuildDockerfile extends BuildStep {
  constructor(logger: BuildLogger, opts: Partial<BuildOpts>) {
    super(logger, opts)

    this.opts.retryable = true
  }

  async name() {
    return 'Build Dockerfile using OpenShift Builder'
  }

  async build(version: VersionDoc, _files: Files, state: any): Promise<void> {
    if (!state.workingDirectory) {
      throw new Error('Build dockerfile requires a working directory')
    }

    const { buildDir } = state

    this.logger.info({}, 'Running in OpenShift. Using OS builder for image building')
    const client = await OpenshiftClient()

    const { namespace, dockerPushSecretName } = config.get('openshift') as any
    const registryUrl = `${config.get('openshift.appPublicRoute')}`

    try {
      await client.api.v1.ns(namespace).secret(dockerPushSecretName).get()
      this.logger.info({}, 'Secret already exists')
    } catch (error) {
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

      const createSecret = await client.api.v1.ns(namespace).secret.post({ body: dockerSecret })
      this.logger.info({ statusCode: createSecret.statusCode, body: createSecret.body }, 'Created docker secret')
    }

    const buildConfigName = `${(version.model as ModelDoc).uuid}-${version.version}`
    const buildConfig = {
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
            name: `${registryUrl}/internal/${(version.model as ModelDoc).uuid}:${version.version}`,
          },
          pushSecret: {
            name: dockerPushSecretName,
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
      await client.apis['build.openshift.io'].v1.namespaces(namespace).buildconfigs(buildConfigName).get()
      this.logger.info({}, 'Build config already exists')
    } catch (error) {
      const buildConfigRes = await client.apis['build.openshift.io'].v1
        .namespaces(namespace)
        .buildconfigs.post({ body: buildConfig })
      this.logger.info({ statusCode: buildConfigRes.statusCode, body: buildConfigRes.body }, 'Created build config')
    }

    const zipFile = `${buildDir}.zip`
    const zip = new AdmZip()
    zip.addLocalFolder(buildDir)
    await zip.writeZip(zipFile)

    const binaryResponse = await client.apis.build.v1
      .ns(namespace)
      .buildconfigs(buildConfigName)
      .instantiatebinary.post({ body: createReadStream(zipFile), json: false })
    this.logger.info({ statusCode: binaryResponse.statusCode, body: binaryResponse.body }, 'Created binary')

    const buildName = JSON.parse(binaryResponse.body).metadata.name
    let curBuild = await client.apis.build.v1.ns(namespace).builds(buildName).get()
    this.logger.info({ statusCode: curBuild.statusCode, body: curBuild.body }, 'Current build status')

    let buildJson = typeof curBuild.body === 'string' ? JSON.parse(curBuild.body) : curBuild.body
    this.logger.info({ buildJson }, 'Starting build JSON')

    while (['Running', 'New'].includes(buildJson.status.phase)) {
      this.logger.info({}, 'Waiting for build to finish')
      await new Promise((resolve) => {
        setTimeout(resolve, 10000)
      })
      curBuild = await client.apis.build.v1.ns(namespace).builds(buildName).get()
      this.logger.info({ statusCode: curBuild.statusCode, body: curBuild.body }, 'Current build status')

      buildJson = typeof curBuild.body === 'string' ? JSON.parse(curBuild.body) : curBuild.body
    }

    const buildLog = await client.apis.build.v1.ns(namespace).builds(buildName).log.get()
    buildLog.body.split(/\r?\n/).forEach((line: string) => version.log('info', line))

    // TODO clean up
    this.logger.info({}, 'Not yet complete')
  }

  async rollback(_version: VersionDoc, _files: Files, _state: any): Promise<void> {
    // TODO rollback
  }

  async tidyUp(version: VersionDoc, files: Files, state: any): Promise<void> {
    return this.rollback(version, files, state)
  }
}

export default function openShiftBuildDockerfile(opts: Partial<BuildOpts> = {}) {
  return (logger: BuildLogger) => new OpenShiftBuildDockerfile(logger, opts)
}
