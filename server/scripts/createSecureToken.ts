/* eslint-disable import/newline-after-import */
import { v4 as uuidv4 } from 'uuid'
import { consoleLog } from '../../utils/logging'
;(async () => {
  consoleLog(uuidv4())
})()
