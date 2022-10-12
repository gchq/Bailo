import config from 'config'
import fs from 'fs/promises'
import path from 'path'
import { Builder, By, until, WebDriver } from 'selenium-webdriver'
import firefox from 'selenium-webdriver/firefox'
import { runCommand } from '../../server/utils/build/build'
import { clearStoredData } from '../../server/utils/clear'
import log from '../../server/utils/logger'

export async function clearData() {
  log.debug('running clearData')
  await clearStoredData()

  log.debug('removing local registry docker images')
  const imageIdentifier = `${config.get('registry.host')}/`

  const stopCmd = `docker stop $(docker ps --format '{{.ID}}' --filter ancestor=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep '${imageIdentifier}'))`
  log.debug(stopCmd)
  await runCommand(stopCmd, log.debug.bind(log), log.error.bind(log), { silentErrors: true })

  const rmCmd = `docker rm $(docker ps -a --format '{{.ID}}' --filter ancestor=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep '${imageIdentifier}'))`
  log.debug(rmCmd)
  await runCommand(rmCmd, log.debug.bind(log), log.error.bind(log), { silentErrors: true })

  const cmd = `docker rmi $(docker images --format '{{.Repository}}:{{.Tag}}' | grep '${imageIdentifier}')`
  log.debug(cmd)
  await runCommand(cmd, log.debug.bind(log), log.error.bind(log), { silentErrors: true })
  log.debug('clearData complete')
}

export async function screenshot(driver: WebDriver, name: string) {
  const image = await driver.takeScreenshot()
  await fs.writeFile(name, image, 'base64')
}

export async function waitForElement(driver: WebDriver, selector: By) {
  for (;;) {
    const element = await driver.wait(until.elementLocated(selector))
    await driver.sleep(500)

    try {
      // sometimes this may fail due to being a stale reference
      // when this happens, retry
      await element.getText()
      return element
    } catch (e: any) {
      if (e.name !== 'StaleElementReferenceError') {
        throw e
      }
    }
  }
}

export async function waitForElements(driver: WebDriver, selector: By) {
  await waitForElement(driver, selector)
  return driver.findElements(selector)
}

export async function getDriver() {
  let builder = await new Builder().forBrowser('firefox')

  if (process.env.HEADLESS === 'true') {
    builder = builder.setFirefoxOptions(new firefox.Options().headless())
  }

  return builder.build()
}

export async function click(driver: WebDriver, selector: By) {
  const element = await waitForElement(driver, selector)
  expect(element).not.toBeNull()

  element.click()

  return element
}

export async function sendKeys(driver: WebDriver, selector: By, keys: string) {
  const element = await waitForElement(driver, selector)

  log.info(await element.getAttribute('type'))
  log.info(selector)

  if (['text', 'textarea'].includes(await element.getAttribute('type'))) {
    log.info('clearing text field')
    await element.clear()
  }
  await element.sendKeys(keys)

  return element
}

export function pause(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

export function fromRelative(relative: string) {
  return path.join(__dirname, '..', '..', relative)
}

export async function selectOption(driver, parentSelector, childSelector, displayValue) {
  const displayUpper = displayValue.toUpperCase()

  const selectList = await driver.findElement(parentSelector)
  await selectList.click()

  const options = await driver.findElements(childSelector)
  for (const option of options) {
    const display = await option.getText()

    if (display.toUpperCase().includes(displayUpper)) {
      await option.click()
      break
    }
  }
}
