export function createFileRef(file: any, type: string, version: any) {
  return {
    name: file.originalname,
    bucket: file.bucket,
    path: `model/${version.model._id.toString()}/version/${version._id.toString()}/raw/${type}/${file.path}`,
  }
}
