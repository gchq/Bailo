import { TokenActions } from '../../models/Token.js'

export const ModelAction = {
  Create: 'model:create',
  View: 'model:view',
  Update: 'model:update',
  Write: 'model:write',
} as const
export type ModelActionKeys = (typeof ModelAction)[keyof typeof ModelAction]

export const ModelCardAction = {
  Create: 'model_card:create',
  View: 'model_card:view',
  Update: 'model_card:update',
  Write: 'model_card:write',
} as const
export type ModelCardActionKeys = (typeof ModelCardAction)[keyof typeof ModelCardAction]

export const ReleaseAction = {
  Create: 'release:create',
  View: 'release:view',
  Delete: 'release:delete',
  Update: 'release:update',
} as const
export type ReleaseActionKeys = (typeof ReleaseAction)[keyof typeof ReleaseAction]

export const AccessRequestAction = {
  Create: 'access_request:create',
  View: 'access_request:view',
  Update: 'access_request:update',
  Delete: 'access_request:delete',
} as const
export type AccessRequestActionKeys = (typeof AccessRequestAction)[keyof typeof AccessRequestAction]

export const SchemaAction = {
  Create: 'schema:create',
  Delete: 'schema:delete',
  Update: 'schema:update',
} as const
export type SchemaActionKeys = (typeof SchemaAction)[keyof typeof SchemaAction]

export const FileAction = {
  Delete: 'file:delete',
  Upload: 'file:upload',
  // 'view' refers to the ability to see metadata about the file.  'download' lets the user view the file contents.
  View: 'file:view',
  Download: 'file:download',
} as const
export type FileActionKeys = (typeof FileAction)[keyof typeof FileAction]

export const ImageAction = {
  Pull: 'image:pull',
  Push: 'image:push',
  List: 'image:list',
  Wildcard: 'image:wildcard',
  Delete: 'image:delete',
} as const
export type ImageActionKeys = (typeof ImageAction)[keyof typeof ImageAction]

export const ResponseAction = {
  Create: 'response:create',
  View: 'response:view',
  Update: 'response:update',
} as const
export type ResponseActionKeys = (typeof ResponseAction)[keyof typeof ResponseAction]

export const ActionLookup = {
  [ModelAction.Create]: TokenActions.ModelWrite.id,
  [ModelAction.View]: TokenActions.ModelRead.id,
  [ModelAction.Update]: TokenActions.ModelWrite.id,
  [ModelAction.Write]: TokenActions.ModelWrite.id,

  [ReleaseAction.Create]: TokenActions.ReleaseWrite.id,
  [ReleaseAction.View]: TokenActions.ReleaseRead.id,
  [ReleaseAction.Delete]: TokenActions.ReleaseWrite.id,
  [ReleaseAction.Update]: TokenActions.ReleaseWrite.id,

  [AccessRequestAction.Create]: TokenActions.AccessRequestWrite.id,
  [AccessRequestAction.View]: TokenActions.AccessRequestRead.id,
  [AccessRequestAction.Update]: TokenActions.AccessRequestWrite.id,
  [AccessRequestAction.Delete]: TokenActions.AccessRequestWrite.id,

  [SchemaAction.Create]: TokenActions.SchemaWrite.id,
  [SchemaAction.Delete]: TokenActions.SchemaWrite.id,
  [SchemaAction.Update]: TokenActions.SchemaWrite.id,

  [FileAction.Delete]: TokenActions.FileWrite.id,
  [FileAction.Upload]: TokenActions.FileWrite.id,
  [FileAction.View]: TokenActions.FileRead.id,
  [FileAction.Download]: TokenActions.FileRead.id,

  [ImageAction.Pull]: TokenActions.ImageRead.id,
  [ImageAction.Push]: TokenActions.ImageWrite.id,
  [ImageAction.List]: TokenActions.ImageRead.id,
  [ImageAction.Wildcard]: TokenActions.ImageWrite.id,
  [ImageAction.Delete]: TokenActions.ImageWrite.id,
} as const
export type ActionLookupKeys = (typeof ActionLookup)[keyof typeof ActionLookup]
