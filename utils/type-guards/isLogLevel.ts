import { LogLevel } from '../../types/interfaces'

type LogLevelString = '10' | '20' | '30' | '40' | '50' | '60'

export const isLogLevelString = (value: string): value is LogLevelString =>
  typeof value === 'string' && !!LogLevel[value]

const isLogLevel = (value: LogLevel | string): value is LogLevel => {
  if (typeof value === 'string') return false
  return !!LogLevel[value]
}

export default isLogLevel
