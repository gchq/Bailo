export function normalizeMulterFile(file: any) {
  return {
    name: file.originalname,
    bucket: file.bucket,
    path: file.path,
  }
}
