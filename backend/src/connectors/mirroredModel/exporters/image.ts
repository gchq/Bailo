import { ModelDoc } from '../../../models/Model.js'
import { ReleaseDoc } from '../../../models/Release.js'
import { UserInterface } from '../../../models/User.js'
import { MirrorLogData } from '../../../services/mirroredModel/mirroredModel.js'
import { addCompressedRegistryImageComponents } from '../../../services/mirroredModel/mirroredModel.js'
import { initialiseTarGzUpload } from '../../../services/mirroredModel/tarball.js'
import { joinDistributionPackageName } from '../../../services/registry.js'
import { Forbidden, InternalError } from '../../../utils/error.js'
import { ReleaseAction } from '../../authorisation/actions.js'
import authorisation from '../../authorisation/index.js'
import { MirrorKind } from '../index.js'
import { BaseExporter, requiresInit } from './base.js'

export class ImageExporter extends BaseExporter {
  protected readonly release: ReleaseDoc
  protected readonly image: ReleaseDoc['images'][number]
  protected distributionPackageName: string | undefined

  constructor(
    user: UserInterface,
    model: ModelDoc,
    release: ReleaseDoc,
    image: ReleaseDoc['images'][number],
    logData: MirrorLogData,
  ) {
    super(user, model, logData)
    this.release = release
    this.image = image
  }

  getRelease() {
    return this.release
  }

  getImage() {
    return this.image
  }

  getDistributionPackageName() {
    return this.distributionPackageName
  }

  protected async _init() {
    await super._init()

    const releaseAuth = await authorisation.release(this.user, this.model!, ReleaseAction.View, this.release)
    if (!releaseAuth.success) {
      throw Forbidden(releaseAuth.info, {
        userDn: this.user.dn,
        modelId: this.model.id,
        semver: this.release.semver,
        ...this.logData,
      })
    }

    const imageCheck = this.release.images.find((image) => image._id.toString() === this.image._id.toString())
    if (!imageCheck) {
      throw InternalError('Could not find image associated with release.', {
        modelId: this.model.id,
        semver: this.release.semver,
        imageId: this.image._id.toString(),
        ...this.logData,
      })
    }
    const imageAuth = await authorisation.image(this.user, this.model!, {
      type: 'repository',
      name: this.model.id,
      actions: ['pull'],
    })
    if (!imageAuth.success) {
      throw Forbidden(imageAuth.info, {
        userDn: this.user.dn,
        modelId: this.model.id,
        semver: this.release.semver,
        imageId: this.image._id.toString(),
        ...this.logData,
      })
    }

    // update the distributionPackageName to use the mirroredModelId
    const modelIdRe = new RegExp(String.raw`^${this.model.id}`)
    this.distributionPackageName = joinDistributionPackageName({
      domain: '',
      path: this.image.name.replace(modelIdRe, this.model!.settings.mirror.destinationModelId!),
      tag: this.image.tag,
    })
  }

  protected getInitialiseTarGzUploadParams(): Parameters<typeof initialiseTarGzUpload> {
    if (!this.model) {
      throw InternalError('Method `getInitialiseTarGzUploadParams` called before `this.model` defined.', {
        ...this.logData,
      })
    }
    if (!this.distributionPackageName) {
      throw InternalError(
        'Method `getInitialiseTarGzUploadParams` called before `this.distributionPackageName` defined.',
        {
          ...this.logData,
        },
      )
    }
    return [
      `${this.image._id.toString()}.tar.gz`,
      {
        schemaVersion: 1,
        exporter: this.user.dn,
        sourceModelId: this.model.id,
        mirroredModelId: this.model!.settings.mirror.destinationModelId!,
        distributionPackageName: this.distributionPackageName!,
        importKind: MirrorKind.Image,
      },
      this.logData,
    ]
  }

  @requiresInit
  async addData() {
    // Non-null assertion operator used due to `requiresInit` performing assertion
    await addCompressedRegistryImageComponents(
      this.user,
      this.model.id,
      this.distributionPackageName!,
      this.tarStream!,
      this.logData,
    )
  }
}
