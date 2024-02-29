import { v4 as uuidv4 } from 'uuid'

import { consoleLog } from '../utils/logger.js'
;(async () => {
  consoleLog(uuidv4())
})()
