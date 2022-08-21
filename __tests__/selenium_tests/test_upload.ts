import { By, until, WebDriver } from 'selenium-webdriver'
import { runCommand } from '../../server/utils/build'
import fs from 'fs/promises'
import Docker from 'dockerode'
import axios from 'axios'
import config from 'config'
import Bailo from '../../lib/node'

import {
  clearData,
  waitForElement,
  waitForElements,
  selectOption,
  getDriver,
  click,
  sendKeys,
  pause,
  fromRelative,
  screenshot,
} from '../__utils__/helpers'
import logger from '../../server/utils/logger'

const binaryPath = fromRelative(config.get('samples.binary'))
const codePath = fromRelative(config.get('samples.code'))
const metadataPath = fromRelative(config.get('samples.uploadMetadata'))
const deploymentMetadataPath = fromRelative(config.get('samples.deploymentMetadata'))

const modelInfo: any = {}

const BAILO_APP_URL = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`
const BAILO_REGISTRY = `${config.get('app.host')}:${config.get('registry.port')}`

async function approveRequests(driver: WebDriver, expectedApprovals: number) {
  let approvalButtons = await waitForElements(driver, By.css('[data-test="approveButton"]'))
  expect(approvalButtons.length).toEqual(expectedApprovals)
  while (approvalButtons.length > 0) {
    approvalButtons[0].click()
    await click(driver, By.css('[data-test="confirmButton"]'))

    // give some time for page to refresh
    // not using waitForElements b/c looping until no longer exists on page
    await driver.sleep(1000)

    const curApprovalButtons = await driver.findElements(By.css('[data-test="approveButton"]'))
    expect(curApprovalButtons.length).toEqual(approvalButtons.length - 1)
    approvalButtons = curApprovalButtons
  }
}

describe('End to end test', () => {
  beforeAll(async () => {
    await clearData()
  }, 40000)

  test(
    'Test can upload a model with a metadata blob',
    async () => {
      const driver = await getDriver()

      try {
        logger.info('getting bailo homepage')
        await driver.get(BAILO_APP_URL)

        logger.info('going to upload page')
        await click(driver, By.css('[data-test="uploadModelLink"]'))

        logger.info('going to json tab')
        await click(driver, By.css('[data-test="uploadJsonTab"]'))

        logger.info('selecting correct schema')
        await selectOption(driver, By.id('schema-selector'), By.css('[role="option"]'), config.get('schemas.model'))

        logger.info('adding code files')
        await sendKeys(driver, By.id('select-code-file'), codePath)
        await sendKeys(driver, By.id('select-binary-file'), binaryPath)

        logger.info('setting metadata')
        const metadata = await fs.readFile(metadataPath, { encoding: 'utf-8' })
        await sendKeys(driver, By.css('div[data-test="metadataTextarea"] div textarea:nth-child(1)'), metadata)

        logger.info('clicking warning checkbox confirming upload is okay')
        await click(driver, By.css('[data-test="warningCheckbox"]'))

        logger.info('submitting upload')
        await click(driver, By.css('[data-test="submitButton"]'))

        logger.info('waiting until url contains model')
        await driver.wait(until.urlContains('/model/'))
        const modelUrl = await driver.getCurrentUrl()
        const mName = modelUrl.match('/.*/model/(?<name>[^/]*)')!.groups!.name
        modelInfo.url = modelUrl
        modelInfo.name = mName

        logger.info({ modelInfo }, 'setting model info')

        const api = new Bailo(
          `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}/api/v1`
        )

        logger.info('getting api model')
        const model = await api.getModel(modelInfo.name)

        while (true) {
          logger.info('')
          const version = await model.getVersion('1')

          if (version.version.built) {
            break
          }

          logger.info('Model not built, retrying in 2 seconds.')
          await pause(2000)
        }

        logger.info({ modelInfo }, 'Received model information')
      } finally {
        logger.info('quitting driver')
        await driver.quit()
      }
    },
    1000 * 9 * 60
  ) // give it up to 9 minutes since Github tests will run with a pull of seldon image (3-5 min)
  // then another 3-ish minutes for initial image build (no existing cache)

  test('test can approve models', async () => {
    logger.info('getting driver')
    const driver = await getDriver()

    try {
      logger.info('getting bailo homepage')
      await driver.get(BAILO_APP_URL)

      logger.info('clicking on review page')
      await click(driver, By.css('[data-test="reviewLink"]'))

      logger.info('approving 2 requests')
      await approveRequests(driver, 2)
    } finally {
      logger.info('quitting driver')
      await driver.quit()
    }
  }, 25000)

  test('test submit deployment for model', async () => {
    logger.info('getting selenium driver')
    const driver = await getDriver()

    try {
      expect(modelInfo.url).not.toBeNull()

      logger.info(`getting model page '${modelInfo.url}'`)
      await driver.get(modelInfo.url)

      // sanity checks
      const api = new Bailo(
        `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}/api/v1`
      )

      // ensure it's built
      logger.info({ name: modelInfo.name }, 'getting model info')
      const model = await api.getModel(modelInfo.name)

      logger.info('getting model version')
      const version = await model.getVersion('1')

      logger.info('expecting model to be built')
      expect(version.version.built).toBeTruthy()

      // ensure it's approved
      logger.info('ensure it is approved')
      expect(version.version.managerApproved).toBe('Accepted')
      expect(version.version.reviewerApproved).toBe('Accepted')

      logger.info('opening deployment button')
      await click(driver, By.css('[data-test="requestDeploymentButton"]'))

      logger.info('going to deployment')
      await click(driver, By.css('[data-test="submitDeployment"]'))

      // Now need to find place to click get request via json blob
      logger.info('getting json tab')
      await click(driver, By.css('[data-test="uploadJsonTab"]'))

      logger.info(`selected current schema`)
      await selectOption(driver, By.id('schema-selector'), By.css('[role="option"]'), config.get('schemas.deployment'))

      logger.info('sending deployment information')
      const deploymentData = await fs.readFile(deploymentMetadataPath, { encoding: 'utf-8' })
      const deploymentInfo = JSON.parse(deploymentData)
      await sendKeys(
        driver,
        By.css('textarea'),
        JSON.stringify(Object.assign({}, deploymentInfo, { modelID: modelInfo.name }))
      )

      logger.info('clicking warning checkbox confirming upload is okay')
      await click(driver, By.css('[data-test="warningCheckbox"]'))

      logger.info(`clicked submit button`)
      await click(driver, By.css('[data-test="submitButton"]'))

      logger.info(`found url contains deployment`)
      await driver.wait(until.urlContains('/deployment/'))
    } finally {
      logger.info('quitting driver')
      await driver.quit()
    }
  }, 40000)

  test('test can approve deployments', async () => {
    logger.info('getting driver')
    const driver = await getDriver()

    try {
      logger.info('getting bailo homepage')
      await driver.get(BAILO_APP_URL)

      logger.info('getting review link')
      await click(driver, By.css('[data-test="reviewLink"]'))

      logger.info('approving 1 request')
      await approveRequests(driver, 1)
    } finally {
      logger.info('quitting final')
      await driver.quit()
    }
  }, 20000)

  test(
    'test built model runs as expected',
    async () => {
      logger.info('getting driver')
      const driver = await getDriver()

      let dockerPassword: string

      try {
        logger.info('getting bailo homepage')
        await driver.get(BAILO_APP_URL)

        logger.info('changing to settings page')
        await click(driver, By.css('[data-test="showUserMenu"]'))
        await click(driver, By.css('[data-test="settingsLink"]'))

        logger.info('showing docker password')
        await click(driver, By.css('[data-test="showTokenButton"]'))

        logger.info('getting docker password')
        const dockerPasswordEl = await waitForElement(driver, By.css('[data-test="dockerPassword"]'))
        dockerPassword = await dockerPasswordEl.getText()

        logger.info({ dockerPassword }, 'got docker password')
      } finally {
        logger.info('quitting driver')
        await driver.quit()
      }

      logger.info('authenticating to docker')
      const docker = new Docker()
      const auth = {
        username: config.get('user.id'),
        password: dockerPassword,
      }
      const imageName = `${BAILO_REGISTRY}/${config.get('user.id')}/${modelInfo.name}:1`
      await runCommand(
        `docker login ${BAILO_REGISTRY} -u ${auth.username} -p ${auth.password}`,
        logger.debug.bind(logger),
        logger.error.bind(logger),
        { silentErrors: true }
      )

      logger.info('pulling container')
      await runCommand(`docker pull ${imageName}`, logger.debug.bind(logger), logger.error.bind(logger), {
        silentErrors: true,
      })

      logger.info('setting up container')
      const container = await docker.createContainer({
        Image: imageName,
        AttachStdin: false,
        AttachStdout: false,
        AttachStderr: false,
        Tty: false,
        OpenStdin: false,
        StdinOnce: false,
        ExposedPorts: {
          '5000/tcp': {},
          '9000/tcp': {},
        },
        PortBindings: {
          '9000/tcp': [
            {
              HostPort: '9999',
              HostIp: '',
            },
          ],
        },
      })

      logger.info('starting container')
      await container.start()

      logger.info('waiting for container to start')
      await pause(5000)

      try {
        logger.info('making request to container')
        const resp = await axios.post('http://localhost:9999/predict', {
          jsonData: { data: ['should be returned backwards'] },
        })
        logger.info('expecting valid response')
        expect(resp.status).toEqual(200)
        expect(resp.data.data.ndarray[0]).toEqual('sdrawkcab denruter eb dluohs')
      } finally {
        logger.info('stopping container')
        await container.stop()

        logger.info('removing container')
        await container.remove()
      }
    },
    1000 * 5 * 60
  )
})
