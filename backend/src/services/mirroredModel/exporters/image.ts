import { ReleaseAction } from '../../../connectors/authorisation/actions.js'
import authorisation from '../../../connectors/authorisation/index.js'
import { ModelDoc } from '../../../models/Model.js'
import { ReleaseDoc } from '../../../models/Release.js'
import { UserInterface } from '../../../models/User.js'
import { MirrorExportLogData, MirrorKind } from '../../../types/types.js'
import { Forbidden, InternalError } from '../../../utils/error.js'
import { joinDistributionPackageName } from '../../registry.js'
import { addCompressedRegistryImageComponents } from '../mirroredModel.js'
import { initialiseTarGzUpload } from '../tarball.js'
import { BaseExporter } from './base.js'

export class ImageExporter extends BaseExporter {
  protected readonly release: ReleaseDoc
  protected readonly images: ReleaseDoc['images']
  protected distributionPackageNames: string[] = []

  constructor(
    user: UserInterface,
    model: ModelDoc,
    release: ReleaseDoc,
    images: ReleaseDoc['images'],
    logData: MirrorExportLogData,
  ) {
    super(user, model, logData)
    this.release = release
    this.images = images
  }

  getRelease() {
    return this.release
  }

  getImages() {
    return this.images
  }

  getDistributionPackageNames() {
    return this.distributionPackageNames
  }

  protected async _init() {
    // update the distributionPackageName to use the mirroredModelId
    const modelIdRe = new RegExp(String.raw`^${this.model.id}`)

    for (const image of this.images) {
      const distributionPackageName = joinDistributionPackageName({
        domain: '',
        path: image.name.replace(modelIdRe, this.model!.settings.mirror.destinationModelId!),
        tag: image.tag,
      })
      this.distributionPackageNames.push(distributionPackageName)
    }
  }

  protected async _checkAuths() {
    for (const image of this.images) {
      const releaseAuth = await authorisation.release(this.user, this.model!, ReleaseAction.View, this.release)
      if (!releaseAuth.success) {
        throw Forbidden(releaseAuth.info, {
          userDn: this.user.dn,
          modelId: this.model.id,
          semver: this.release.semver,
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
          imageId: image.id,
          ...this.logData,
        })
      }
    }
  }

  protected getInitialiseTarGzUploadParams(): Parameters<typeof initialiseTarGzUpload> {
    if (!this.model) {
      throw InternalError('Method `getInitialiseTarGzUploadParams` called before `this.model` defined.', {
        ...this.logData,
      })
    }
    return [
      `${this.model.id}-${this.release.semver}.tar.gz`,
      {
        schemaVersion: 2,
        exporter: this.user.dn,
        sourceModelId: this.model.id,
        mirroredModelId: this.model!.settings.mirror.destinationModelId!,
        distributionPackageName: this.distributionPackageNames[0],
        importKind: MirrorKind.Image,
        exportId: this.logData.exportId,
      },
      this.logData,
    ]
  }

  protected async _addData() {
    // Non-null assertion operator used due to `requiresInit` performing assertion
    await addCompressedRegistryImageComponents(
      this.user,
      this.model.id,
      this.distributionPackageNames,
      this.tarStream!,
      this.logData,
    )
  }
}
