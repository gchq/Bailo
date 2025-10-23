import { PassThrough } from 'node:stream'
import zlib from 'node:zlib'

import { Pack } from 'tar-stream'

import { ModelAction } from '../../../connectors/authorisation/actions.js'
import authorisation from '../../../connectors/authorisation/index.js'
import { ModelDoc } from '../../../models/Model.js'
import { UserInterface } from '../../../models/User.js'
import { isBailoError } from '../../../types/error.js'
import { BadReq, Forbidden, InternalError } from '../../../utils/error.js'
import { MirrorLogData } from '../mirroredModel.js'
import { finaliseTarGzUpload, initialiseTarGzUpload } from '../tarball.js'

function wrapErrorContext(err: unknown, context: ClassMethodDecoratorContext, self: BaseExporter): never {
  if (isBailoError(err)) {
    err.message += `\nMethod \`${String(self.constructor.name)}.${String(context.name)}\` failure.`
    throw err
  }
  throw InternalError(`Method \`${String(self.constructor.name)}.${String(context.name)}\` failed.`, {
    error: err,
    ...self.getLogData(),
  })
}

export function requiresInit<M extends (this: BaseExporter, ...args: any[]) => any>(
  value: M,
  context: ClassMethodDecoratorContext,
): M {
  return async function (this: BaseExporter, ...args: any[]) {
    if (!this.initialised) {
      throw InternalError(
        `Method \`${String(this.constructor.name)}.${String(context.name)}\` called before \`init()\`.`,
        { ...this.logData },
      )
    }
    return await value.apply(this, args)
  } as M
}

export function checkAuths<M extends (this: BaseExporter, ...args: any[]) => any>(
  value: M,
  context: ClassMethodDecoratorContext,
): M {
  return async function (this: BaseExporter, ...args: any[]) {
    try {
      await this.checkAuths()
    } catch (err) {
      wrapErrorContext(err, context, this)
    }
    return await value.apply(this, args)
  } as M
}

export function withStreams<M extends (this: BaseExporter, ...args: any[]) => any>(
  value: M,
  context: ClassMethodDecoratorContext,
): M {
  return async function (this: BaseExporter, ...args: any[]) {
    if (!this.tarStream || !this.gzipStream || !this.uploadStream || !this.uploadPromise) {
      try {
        await this.setupStreams()
      } catch (err) {
        wrapErrorContext(err, context, this)
      }
    }
    return await value.apply(this, args)
  } as M
}

type AbstractConstructor<T = object> = abstract new (...args: any[]) => T
function withStreamCleanupClass<T extends AbstractConstructor<BaseExporter>>(Base: T) {
  abstract class WithCleanup extends Base {
    protected cleanupStreams() {
      this.tarStream?.destroy()
      this.gzipStream?.destroy()
      this.uploadStream?.destroy()
    }

    constructor(...args: any[]) {
      super(...args)

      const proto = Object.getPrototypeOf(this)
      const methodNames = Object.getOwnPropertyNames(proto).filter(
        (name) => typeof (this as any)[name] === 'function' && name !== 'constructor',
      )

      for (const name of methodNames) {
        const original = (this as any)[name]
        ;(this as any)[name] = (...mArgs: any[]) => {
          try {
            const result = original.apply(this, mArgs)
            // if result is a Promise, attach cleanup to catch
            if (result && typeof result.then === 'function') {
              return result.catch((err: unknown) => {
                this.cleanupStreams()
                wrapErrorContext(err, { name } as ClassMethodDecoratorContext, this)
              })
            }
            // otherwise synchronous execution, just return the value
            return result
          } catch (err) {
            this.cleanupStreams()
            wrapErrorContext(err, { name } as ClassMethodDecoratorContext, this)
          }
        }
      }
    }
  }

  return WithCleanup
}

@withStreamCleanupClass
export abstract class BaseExporter {
  protected abstract _init(): Promise<void> | void
  protected abstract _addData(): Promise<void> | void
  protected abstract _checkAuths(): Promise<void> | void
  protected abstract getInitialiseTarGzUploadParams():
    | Promise<Parameters<typeof initialiseTarGzUpload>>
    | Parameters<typeof initialiseTarGzUpload>

  protected readonly logData: MirrorLogData
  protected readonly user: UserInterface
  protected readonly model: ModelDoc

  protected tarStream?: Pack
  protected gzipStream?: zlib.Gzip
  protected uploadStream?: PassThrough
  protected uploadPromise?: Promise<void>
  protected initialised = false
  protected authCheck = false

  constructor(user: UserInterface, model: ModelDoc, logData: MirrorLogData) {
    this.user = user
    this.model = model
    this.logData = { exporterType: this.constructor.name, ...logData }
  }

  getModel() {
    return this.model
  }

  getLogData() {
    return this.logData
  }

  async init() {
    if (!this.model.settings?.mirror?.destinationModelId) {
      throw BadReq("The 'Destination Model ID' has not been set on this model.", this.logData)
    }
    if (!this.model.card?.schemaId) {
      throw BadReq('You must select a schema for your model before export.', this.logData)
    }
    await this._init()
    this.initialised = true
    return this
  }

  protected async _checkModelAuths() {
    const modelAuth = await authorisation.model(this.user, this.model, ModelAction.Export)
    if (!modelAuth.success) {
      throw Forbidden(modelAuth.info, { userDn: this.user.dn, modelId: this.model.id, ...this.logData })
    }
  }

  async checkAuths() {
    if (!this.authCheck) {
      await this._checkModelAuths()
      await this._checkAuths()
      this.authCheck = true
    }
  }

  @requiresInit
  protected async setupStreams() {
    const params = await this.getInitialiseTarGzUploadParams()
    const { tarStream, gzipStream, uploadStream, uploadPromise } = await initialiseTarGzUpload(...params)
    this.tarStream = tarStream
    this.gzipStream = gzipStream
    this.uploadStream = uploadStream
    this.uploadPromise = uploadPromise
  }

  @requiresInit
  @checkAuths
  @withStreams
  async addData() {
    // wrap to enforce extra checks
    await this._addData()
  }

  @requiresInit
  @checkAuths
  @withStreams
  async finalise() {
    await finaliseTarGzUpload(this.tarStream!, this.uploadPromise!)
  }
}
