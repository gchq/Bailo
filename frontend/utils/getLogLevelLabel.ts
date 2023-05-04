import { LogLevel, LogLevelLabel } from '../types/types'

const getLogLevelLabel = (level: LogLevel): LogLevelLabel => {
  const label: LogLevelLabel | undefined = LogLevelLabel[LogLevel[level]]

  if (!label) {
    throw new Error('Unexpected log level')
  }

  return label
}

export default getLogLevelLabel
