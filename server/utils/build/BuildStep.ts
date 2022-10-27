import { VersionWithModel } from '../../../types/models/version'
import { FileRef } from './build'
import { BuildLogger } from './BuildLogger'

export type Files = {
  [name: string]: FileRef
}

export interface BuildOpts {
  retryable: boolean
}

export abstract class BuildStep {
  logger: BuildLogger

  opts: BuildOpts = {
    retryable: false,
  }

  props: any

  constructor(logger: BuildLogger, opts: Partial<BuildOpts>, props?: any) {
    this.opts = { ...this.opts, ...opts }
    this.logger = logger
    this.props = props
  }

  abstract name(version: VersionWithModel, files: Files, state: any): Promise<string>

  abstract build(version: VersionWithModel, files: Files, state: any): Promise<any>

  abstract rollback(version: VersionWithModel, files: Files, state: any): Promise<any>

  async tidyUp(_version: VersionWithModel, _files: Files, _state: any): Promise<any> {
    // tidying up is optional
  }
}
