import { objectExists } from '../../clients/s3.js'
import { MirrorImportLogData } from '../../types/types.js'
import { InternalError } from '../../utils/error.js'
import { createFilePath, isFileInterfaceDoc } from '../fileSplit.js'

export async function parseFile(
  file: unknown,
  mirroredModelId: string,
  sourceModelId: string,
  logData: MirrorImportLogData,
) {
  if (!isFileInterfaceDoc(file)) {
    throw InternalError('Data cannot be converted into a file.', { file, mirroredModelId, sourceModelId, ...logData })
  }

  file.path = createFilePath(mirroredModelId, file.id)

  try {
    file.complete = await objectExists(file.path)
  } catch (error) {
    throw InternalError('Error checking existence of file in storage.', {
      path: file.path,
      mirroredModelId,
      sourceModelId,
      error,
      ...logData,
    })
  }

  const modelId = file.modelId
  if (sourceModelId !== modelId) {
    throw InternalError(
      'Compressed file contains files that have a model ID that does not match the source model Id.',
      {
        file,
        mirroredModelId,
        sourceModelId,
        ...logData,
      },
    )
  }
  file.modelId = mirroredModelId

  return file
}
