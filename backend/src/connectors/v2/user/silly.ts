import { BaseUserConnector } from './index.js'

export class SillyUserConnector implements BaseUserConnector {
  constructor() {
    // do nothing
  }

  static async init() {
    // This silly user connector needs to do no setup, so we can just return a new
    // instance of our class
    return new SillyUserConnector()
  }
}
