import { LogLevel, LogLevelLabel } from '../types/interfaces'

const getLogLevelLabel = (level: LogLevel): LogLevelLabel => {
  const label: LogLevelLabel | undefined = LogLevelLabel[LogLevel[level]]

  if (!label) {
    throw new Error('Unexpected log level')
  }

  return label
}

export default getLogLevelLabel
