import PQueue from 'p-queue'

import config from '../../../utils/config.js'

export const exportQueue: PQueue = new PQueue({ concurrency: config.modelMirror.export.concurrency })
