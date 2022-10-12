import { LogLevel } from '../../types/interfaces'

type LogLevelString = `${LogLevel}`

export const isLogLevelString = (value: string): value is LogLevelString =>
  typeof value === 'string' && !!LogLevel[value]

const isLogLevel = (value: LogLevel | string): value is LogLevel => {
  if (typeof value === 'string') return false
  return !!LogLevel[value]
}

export default isLogLevel
