import { ModelDoc } from '../../../models/Model.js'
import { ReleaseDoc } from '../../../models/Release.js'
import { UserInterface } from '../../../models/User.js'
import { addCompressedRegistryImageComponents } from '../../../services/mirroredModel/mirroredModel.js'
import { initialiseTarGzUpload } from '../../../services/mirroredModel/tarball.js'
import { joinDistributionPackageName } from '../../../services/registry.js'
import { getReleaseBySemver } from '../../../services/release.js'
import { Forbidden, InternalError } from '../../../utils/error.js'
import { ReleaseAction } from '../../authorisation/actions.js'
import authorisation from '../../authorisation/index.js'
import { MirrorKind } from '../index.js'
import { BaseExporter, requiresInit } from './base.js'

export class ImageExporter extends BaseExporter {
  protected readonly semver: string
  protected release: ReleaseDoc | undefined
  protected readonly imageId: string
  protected image: ReleaseDoc['images'][number] | undefined
  protected distributionPackageName: string | undefined

  constructor(
    user: UserInterface,
    model: string | ModelDoc,
    release: string | ReleaseDoc,
    image: string | ReleaseDoc['images'][number],
    logData?: Record<string, unknown>,
  ) {
    super(user, model, logData)

    if (typeof release === 'string') {
      this.semver = release
    } else {
      this.release = release
      this.semver = this.release.semver
    }
    if (typeof image === 'string') {
      this.imageId = image
    } else {
      this.image = image
      this.imageId = this.image._id.toString()
    }
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

  async _init() {
    await super._init()

    if (!this.release) {
      this.release = await getReleaseBySemver(this.user, this.model!, this.semver)
    }
    const releaseAuth = await authorisation.release(this.user, this.model!, ReleaseAction.View, this.release)
    if (!releaseAuth.success) {
      throw Forbidden(releaseAuth.info, {
        userDn: this.user.dn,
        modelId: this.modelId,
        semver: this.semver,
        ...this.logData,
      })
    }

    if (!this.image) {
      this.image = this.release.images.find((image) => image._id.toString() === this.imageId)
      if (!this.image) {
        throw InternalError('Could not find image associated with release.', {
          modelId: this.modelId,
          semver: this.semver,
          imageId: this.imageId,
          ...this.logData,
        })
      }
    }
    const imageAuth = await authorisation.image(this.user, this.model!, {
      type: 'repository',
      name: this.modelId,
      actions: ['pull'],
    })
    if (!imageAuth.success) {
      throw Forbidden(imageAuth.info, {
        userDn: this.user.dn,
        modelId: this.modelId,
        semver: this.semver,
        imageId: this.imageId,
        ...this.logData,
      })
    }

    // update the distributionPackageName to use the mirroredModelId
    const modelIdRe = new RegExp(String.raw`^${this.modelId}`)
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
      `${this.imageId}.tar.gz`,
      {
        exporter: this.user.dn,
        sourceModelId: this.modelId,
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
      this.modelId,
      this.distributionPackageName!,
      this.tarStream!,
      this.logData,
    )
  }
}
