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

/**
 * Wraps any thrown error with additional execution context information.
 *
 * - If `err` is a BailoError, appends method identification to the message and rethrows it.
 * - If not, wraps it into an `InternalError` with method details and relevant `BaseExporter` log data.
 *
 * @param err - The caught error or thrown value.
 * @param context - Method decorator context containing method metadata.
 * @param self - The calling `BaseExporter` instance.
 * @throws InternalError | BailoError
 */
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

/**
 * Method decorator.
 * Ensures that the decorated method can only run after `init()` has been successfully invoked.
 *
 * @typeParam M - Method type extending a function bound to `BaseExporter`.
 * @param value - The original method implementation.
 * @param context - Method decorator metadata.
 * @throws InternalError - If called before the instance is initialised.
 */
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

/**
 * Method decorator.
 * Invokes `checkAuths()` before executing the decorated method.
 * If `checkAuths()` fails, wraps the error with additional method context information.
 *
 * @typeParam M - Method type extending a function bound to `BaseExporter`.
 * @param value - The original method implementation.
 * @param context - Method decorator metadata.
 */
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

/**
 * Method decorator.
 * Ensures tar/gzip/upload streams are set up prior to executing the method.
 * If not already configured, calls `setupStreams()` and wraps errors with context.
 *
 * @typeParam M - Method type extending a function bound to `BaseExporter`.
 * @param value - The original method implementation.
 * @param context - Method decorator metadata.
 */
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
/**
 * Class decorator factory.
 * Wraps **all instance methods** (excluding the constructor) in error-handling logic that:
 * - Cleans up tar/gzip/upload streams upon exception.
 * - Augments thrown errors with method context via `wrapErrorContext`.
 * Works for both synchronous and asynchronous errors.
 *
 * @param Base - Abstract class extending `BaseExporter` to decorate.
 * @returns A subclass with cleanup/error-wrapping logic applied to all methods.
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
  /**
   * Method to be implemented by subclasses to perform exporter-specific initialisation.
   */
  protected abstract _init(): Promise<void> | void
  /**
   * Method to be implemented by subclasses to add data to the export streams.
   */
  protected abstract _addData(): Promise<void> | void
  /**
   * Method to be implemented by subclasses for exporter-specific authorisation checks.
   */
  protected abstract _checkAuths(): Promise<void> | void
  /**
   * Provides parameters for `initialiseTarGzUpload()`.
   */
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

  /**
   * Constructs a `BaseExporter` with user, model, and logging context.
   *
   * @param user - The current user initiating the export.
   * @param model - The model being exported.
   * @param logData - Additional log metadata for auditing/tracing.
   */
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

  /**
   * Initialises the exporter.
   * - Validates required model settings (destination ID, schema).
   * - Calls subclass `_init()`.
   * - Marks exporter as `initialised`.
   *
   * @throws BadReq - If required model settings are missing.
   * @returns This exporter instance.
   */
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

  /**
   * Checks core model-level export permissions via the authorisation connector.
   *
   * @throws Forbidden - if the user lacks required rights.
   */
  protected async _checkModelAuths() {
    const modelAuth = await authorisation.model(this.user, this.model, ModelAction.Export)
    if (!modelAuth.success) {
      throw Forbidden(modelAuth.info, { userDn: this.user.dn, modelId: this.model.id, ...this.logData })
    }
  }

  /**
   * Runs both model-level and subclass-specific authorisation checks.
   * Executes only once per exporter lifecycle unless manually reset.
   */
  async checkAuths() {
    if (!this.authCheck) {
      await this._checkModelAuths()
      await this._checkAuths()
      this.authCheck = true
    }
  }

  /**
   * Called automatically by `@withStreams` if streams are missing.
   * Initialises tar/gzip/upload streams for the export process.
   */
  @requiresInit
  protected async setupStreams() {
    const params = await this.getInitialiseTarGzUploadParams()
    const { tarStream, gzipStream, uploadStream, uploadPromise } = await initialiseTarGzUpload(...params)
    this.tarStream = tarStream
    this.gzipStream = gzipStream
    this.uploadStream = uploadStream
    this.uploadPromise = uploadPromise
  }

  /**
   * Public entry point to add data to the export package.
   *
   * @decorator `@requiresInit` Ensures exporter initialisation.
   * @decorator `@checkAuths` Ensures authorisation checks pass.
   * @decorator `@withStreams` Ensures streams are configured.
   */
  @requiresInit
  @checkAuths
  @withStreams
  async addData() {
    // wrap to enforce extra checks
    await this._addData()
  }

  /**
   * Finalises the export process by completing and uploading the tar.gz file.
   *
   * @decorator `@requiresInit`
   * @decorator `@checkAuths`
   * @decorator `@withStreams`
   */
  @requiresInit
  @checkAuths
  @withStreams
  async finalise() {
    await finaliseTarGzUpload(this.tarStream!, this.uploadPromise!)
  }
}
