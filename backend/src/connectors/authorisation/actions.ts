import { TokenActions } from '../../models/Token.js'

export const ModelAction = {
  Create: 'model:create',
  View: 'model:view',
  Update: 'model:update',
  Write: 'model:write',
} as const
export type ModelActionKeys = (typeof ModelAction)[keyof typeof ModelAction]

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

export const ActionLookup = {
  [ModelAction.Create]: TokenActions.ModelWrite,
  [ModelAction.View]: TokenActions.ModelRead,
  [ModelAction.Update]: TokenActions.ModelWrite,
  [ModelAction.Write]: TokenActions.ModelWrite,

  [ReleaseAction.Create]: TokenActions.ReleaseWrite,
  [ReleaseAction.View]: TokenActions.ReleaseRead,
  [ReleaseAction.Delete]: TokenActions.ReleaseWrite,
  [ReleaseAction.Update]: TokenActions.ReleaseWrite,

  [AccessRequestAction.Create]: TokenActions.AccessRequestWrite,
  [AccessRequestAction.View]: TokenActions.AccessRequestRead,
  [AccessRequestAction.Update]: TokenActions.AccessRequestWrite,
  [AccessRequestAction.Delete]: TokenActions.AccessRequestWrite,

  [SchemaAction.Create]: TokenActions.SchemaWrite,
  [SchemaAction.Delete]: TokenActions.SchemaWrite,
  [SchemaAction.Update]: TokenActions.SchemaWrite,

  [FileAction.Delete]: TokenActions.FileWrite,
  [FileAction.Upload]: TokenActions.FileWrite,
  [FileAction.View]: TokenActions.FileRead,
  [FileAction.Download]: TokenActions.FileRead,

  [ImageAction.Pull]: TokenActions.ImageRead,
  [ImageAction.Push]: TokenActions.ImageWrite,
  [ImageAction.List]: TokenActions.ImageRead,
  [ImageAction.Wildcard]: TokenActions.ImageWrite,
  [ImageAction.Delete]: TokenActions.ImageWrite,
} as const
export type ActionLookupKeys = (typeof ActionLookup)[keyof typeof ActionLookup]
