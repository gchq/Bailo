/* eslint-disable no-console */

/**
 * These utility functions are only to be used for logging that is intended to be
 * used in production, to prevent us having to disable eslint in multiple places.
 * This way we can rely on eslint to pick up any forgotten logging that was used
 * for debugging purposes during development.
 */

export const consoleLog = (message: string, ...optionalParams: unknown[]): void => {
  console.log(message, ...optionalParams)
}

export const consoleInfo = (message: string, ...optionalParams: unknown[]): void => {
  console.info(message, ...optionalParams)
}

export const consoleWarn = (message: string, ...optionalParams: unknown[]): void => {
  console.warn(message, ...optionalParams)
}

export const consoleError = (message: string, ...optionalParams: unknown[]): void => {
  console.error(message, ...optionalParams)
}
