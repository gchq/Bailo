export const ModelAction = {
  Create: 'create',
  View: 'view',
  Update: 'update',
  Write: 'write',
} as const
export type ModelActionKeys = (typeof ModelAction)[keyof typeof ModelAction]

export const ReleaseAction = {
  Create: 'create',
  View: 'view',
  Delete: 'delete',
  Update: 'update',
}
export type ReleaseActionKeys = (typeof ReleaseAction)[keyof typeof ReleaseAction]

export const AccessRequestAction = {
  Create: 'create',
  View: 'view',
  Update: 'update',
  Delete: 'delete',
}
export type AccessRequestActionKeys = (typeof AccessRequestAction)[keyof typeof AccessRequestAction]

export const SchemaAction = {
  Create: 'create',
  Delete: 'delete',
  Update: 'update',
}
export type SchemaActionKeys = (typeof SchemaAction)[keyof typeof SchemaAction]

export const FileAction = {
  Delete: 'delete',
  Upload: 'upload',
  // 'view' refers to the ability to see metadata about the file.  'download' lets the user view the file contents.
  View: 'view',
  Download: 'download',
}
export type FileActionKeys = (typeof FileAction)[keyof typeof FileAction]

export const ImageAction = {
  Pull: 'pull',
  Push: 'push',
  List: 'list',
}

export type ImageActionKeys = (typeof ImageAction)[keyof typeof ImageAction]

export const ModelCardAction = {
  Create: 'create',
  View: 'view',
  Update: 'update',
  Write: 'write',
} as const
export type ModelCardActionKeys = (typeof ModelCardAction)[keyof typeof ModelCardAction]
