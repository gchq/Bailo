import { By, until, WebDriver } from 'selenium-webdriver'
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

  test('Test can upload a model with a metadata blob', async () => {
    const driver = await getDriver()

    try {
      await driver.get(BAILO_APP_URL)

      await click(driver, By.css('[data-test="uploadModelLink"]'))
      await click(driver, By.css('[data-test="uploadJsonTab"]'))

      await selectOption(driver, By.id('schema-selector'), By.css('[role="option"]'), config.get('schemas.model'))

      await sendKeys(driver, By.id('select-code-file'), codePath)
      await sendKeys(driver, By.id('select-binary-file'), binaryPath)

      const metadata = await fs.readFile(metadataPath, { encoding: 'utf-8' })
      await sendKeys(driver, By.css('textarea'), metadata)

      await click(driver, By.css('[data-test="submitButton"]'))

      await driver.wait(until.urlContains('/model/'))
      const modelUrl = await driver.getCurrentUrl()
      const mName = modelUrl.match('/.*/model/(?<name>[^/]*)')!.groups!.name
      modelInfo.url = modelUrl
      modelInfo.name = mName

      const api = new Bailo(
        `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}/api/v1`
      )
      const model = await api.getModel(modelInfo.name)

      while (true) {
        const version = await model.getVersion('1')

        if (version.version.built) {
          break
        }

        logger.info('Model not built, retrying in 2 seconds.')
        await pause(2000)
      }

      logger.info(modelInfo, 'Received model information')
    } finally {
      await driver.quit()
    }
  }, 120000)

  test('test can approve models', async () => {
    const driver = await getDriver()

    try {
      await driver.get(BAILO_APP_URL)
      await click(driver, By.css('[data-test="reviewLink"]'))
      await approveRequests(driver, 2)
    } finally {
      await driver.quit()
    }
  }, 25000)

  test('test submit deployment for model', async () => {
    const driver = await getDriver()

    try {
      expect(modelInfo.url).not.toBeNull()
      await driver.get(modelInfo.url)

      await click(driver, By.css('[data-test="requestDeploymentButton"]'))
      await click(driver, By.css('[data-test="submitDeployment"]'))

      // Now need to find place to click get request via json blob
      await click(driver, By.css('[data-test="uploadJsonTab"]'))

      await selectOption(driver, By.id('schema-selector'), By.css('[role="option"]'), config.get('schemas.deployment'))

      const deploymentData = await fs.readFile(deploymentMetadataPath, { encoding: 'utf-8' })
      const deploymentInfo = JSON.parse(deploymentData)
      await sendKeys(
        driver,
        By.css('textarea'),
        JSON.stringify(Object.assign({}, deploymentInfo, { modelID: modelInfo.name }))
      )

      await click(driver, By.css('[data-test="submitButton"]'))
      await driver.wait(until.urlContains('/deployment/'))
    } finally {
      await driver.quit()
    }
  }, 40000)

  test('test can approve deployments', async () => {
    const driver = await getDriver()

    try {
      await driver.get(BAILO_APP_URL)
      await click(driver, By.css('[data-test="reviewLink"]'))
      await approveRequests(driver, 1)
    } finally {
      await driver.quit()
    }
  }, 20000)

  test('test built model runs as expected', async () => {
    const driver = await getDriver()

    let dockerPassword: string

    try {
      await driver.get(BAILO_APP_URL)
      await click(driver, By.css('[data-test="settingLink"]'))
      await click(driver, By.css('[data-test="showTokenButton"]'))

      const dockerPasswordEl = await waitForElement(driver, By.css('[data-test="dockerPassword"]'))
      dockerPassword = await dockerPasswordEl.getText()
    } finally {
      await driver.quit()
    }

    const docker = new Docker()
    const auth = {
      username: config.get('user.id'),
      password: dockerPassword,
    }

    const imageName = `${BAILO_REGISTRY}/${config.get('user.id')}/${modelInfo.name}:1`
    const dockerResp = await docker.createImage(auth, { fromImage: imageName })
    expect(dockerResp.statusCode).toEqual(200)
    logger.info('created image')

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

    await container.start()
    await pause(500)

    try {
      await pause(1500) //give container time to start running
      const resp = await axios.post('http://localhost:9999/predict', {
        jsonData: { data: ['should be returned backwards'] },
      })
      expect(resp.status).toEqual(200)
      expect(resp.data.data.ndarray[0]).toEqual('sdrawkcab denruter eb dluohs')
    } finally {
      await container.stop()
      await container.remove()
    }
  }, 40000)
})
