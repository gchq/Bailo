import { LogLevel } from '../../src/FilterMenu/LogLevelSelect'

const isLogLevel = (value: LogLevel | string): value is LogLevel => !!LogLevel[value]

export default isLogLevel
