import Docker from 'dockerode'

import { getAccessToken } from '../routes/v1/registryAuth.js'
import log from '../services/log.js'

export default async function runScript() {
  const user = 'user'
  const registryAddress = 'localhost:8080'
  const imageRepository = 'test-model-ow6t09'
  const imageName = 'testmodelimage'
  const imageTag = '1'
  const imageFull = `${registryAddress}/${imageRepository}/${imageName}:${imageTag}`

  const authToken = await getAccessToken({ dn: user }, [
    { type: 'repository', class: '', name: `${imageRepository}/${imageName}`, actions: ['*'] },
  ])

  log.info('connecting to Docker API...')
  const docker = new Docker()

  const auth = {
    identitytoken: authToken,
  }

  try {
    log.info(`Pulling ${imageFull}`)
    const stream = await docker.pull(imageFull, {
      authconfig: auth,
    })

    await new Promise<void>((resolve, reject) => {
      docker.modem.followProgress(stream, (err, output) => {
        if (err) {
          reject(err)
        } else {
          log.info('Got output', output)
          resolve()
        }
      })
    })

    log.info(`Image successfully pulled: ${imageFull}`)
  } catch (error) {
    log.error(`Error pulling Docker image`)
    log.error(error)
  }
}

runScript()
