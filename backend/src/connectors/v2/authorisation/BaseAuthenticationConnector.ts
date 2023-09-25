import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { UserDoc } from '../../../models/v2/User.js'

export const ModelAction = {
  Create: 'create',
  View: 'view',
  Update: 'update',
  UploadFile: 'upload_file',
  Write: 'write',
} as const
export type ModelActionKeys = (typeof ModelAction)[keyof typeof ModelAction]

export const ReleaseAction = {
  Create: 'create',
  View: 'view',
  Delete: 'delete',
}
export type ReleaseActionKeys = (typeof ReleaseAction)[keyof typeof ReleaseAction]

export abstract class BaseAuthorisationConnector {
  abstract userModelAction(user: UserDoc, model: ModelDoc, action: ModelActionKeys): Promise<boolean>
  abstract userReleaseAction(
    user: UserDoc,
    model: ModelDoc,
    release: ReleaseDoc,
    action: ReleaseActionKeys,
  ): Promise<boolean>
  abstract getEntities(user: UserDoc): Promise<Array<string>>
  abstract getUserInformation(userEntity: string): Promise<{ email: string }>
  abstract getEntityMembers(entity: string): Promise<Array<string>>

  async getUserInformationList(entity): Promise<Promise<{ email: string }>[]> {
    const entities = await this.getEntityMembers(entity)
    return entities.map((member) => this.getUserInformation(member))
  }
}
