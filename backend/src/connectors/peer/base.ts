import { SystemStatus } from '../../types/types.js'

export abstract class BasePeerConnector {
  abstract ping(): Promise<SystemStatus>
}
