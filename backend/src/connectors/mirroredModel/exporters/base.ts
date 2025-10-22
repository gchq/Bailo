import { PassThrough } from 'node:stream'
import zlib from 'node:zlib'

import { Pack } from 'tar-stream'

import { ModelDoc } from '../../../models/Model.js'
import { UserInterface } from '../../../models/User.js'
import { MirrorLogData } from '../../../services/mirroredModel/mirroredModel.js'
import { finaliseTarGzUpload, initialiseTarGzUpload } from '../../../services/mirroredModel/tarball.js'
import { BadReq, Forbidden, InternalError } from '../../../utils/error.js'
import { ModelAction } from '../../authorisation/actions.js'
import authorisation from '../../authorisation/index.js'

export function requiresInit<M extends (this: BaseExporter, ...args: any[]) => any>(
  value: M,
  context: ClassMethodDecoratorContext,
): M {
  return function (this: BaseExporter, ...args: any[]) {
    if (!this.initialised) {
      throw InternalError(
        `Method \`${String(this.constructor.name)}.${String(context.name)}\` called before \`init()\`.`,
        {
          ...this.logData,
        },
      )
    }
    if (!this.tarStream || !this.gzipStream || !this.uploadStream || !this.uploadPromise) {
      throw InternalError(
        `Method \`${String(this.constructor.name)}.${String(context.name)}\` streams not initialised before use.`,
        { ...this.logData },
      )
    }
    return value.apply(this, args)
  } as M
}

// Helper for below `withStreamCleanupClass` to work with abstract classes as well as concrete implementations
type AbstractConstructor<T = object> = abstract new (...args: any[]) => T
/**
 * Class decorator for `BaseExporter` and its subclasses that automatically wraps all instance
 * methods with error-handling logic to ensure cleanup of export-related streams (`tarStream`,
 * `gzipStream`, `uploadStream`) when any method throws.
 */
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
                throw err
              })
            }
            // otherwise synchronous execution, just return the value
            return result
          } catch (err) {
            this.cleanupStreams()
            throw err
          }
        }
      }
    }
  }

  return WithCleanup
}

@withStreamCleanupClass
export abstract class BaseExporter {
  abstract addData(): Promise<void> | void

  protected abstract getInitialiseTarGzUploadParams():
    | Promise<Parameters<typeof initialiseTarGzUpload>>
    | Parameters<typeof initialiseTarGzUpload>

  protected readonly logData: MirrorLogData

  protected readonly user: UserInterface
  protected readonly model: ModelDoc

  protected tarStream: Pack | undefined
  protected gzipStream: zlib.Gzip | undefined
  protected uploadStream: PassThrough | undefined
  protected uploadPromise: Promise<void> | undefined
  protected initialised: boolean = false

  constructor(user: UserInterface, model: ModelDoc, logData: MirrorLogData) {
    this.user = user
    this.model = model
    this.logData = { exporterType: this.constructor.name, ...logData }
  }

  getModel() {
    return this.model
  }

  protected async _init() {
    if (!this.model.settings.mirror.destinationModelId) {
      throw BadReq("The 'Destination Model ID' has not been set on this model.", this.logData)
    }
    if (!this.model.card || !this.model.card.schemaId) {
      throw BadReq('You must select a schema for your model before you can start the export process.', this.logData)
    }
    const modelAuth = await authorisation.model(this.user, this.model, ModelAction.Export)
    if (!modelAuth.success) {
      throw Forbidden(modelAuth.info, { userDn: this.user.dn, modelId: this.model.id, ...this.logData })
    }
  }

  async _setupStreams() {
    ;({
      tarStream: this.tarStream,
      gzipStream: this.gzipStream,
      uploadStream: this.uploadStream,
      uploadPromise: this.uploadPromise,
    } = await initialiseTarGzUpload(...(await this.getInitialiseTarGzUploadParams())))
  }

  async init() {
    await this._init()
    await this._setupStreams()
    this.initialised = true
    return this
  }

  @requiresInit
  async finalise() {
    // Non-null assertion operator used due to `requiresInit` performing assertion
    await finaliseTarGzUpload(this.tarStream!, this.uploadPromise!)
  }
}
