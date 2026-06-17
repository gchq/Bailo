// Global dayjs configuration file
import dayjs from 'dayjs'
// Apply plugins
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(customParseFormat)
// Configure locale
import 'dayjs/locale/en-gb'
dayjs.locale('en-gb')

// Basic runtime guard
if (typeof dayjs.utc !== 'function') {
  throw new Error('Dayjs UTC plugin not yet loaded, ensure dayjsConfig.ts is imported first.')
}

// re-export, under alias @dayjs (see tsconfig.json)
export default dayjs
export type { Dayjs } from 'dayjs'
