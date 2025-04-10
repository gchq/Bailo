import { Stack, Typography } from '@mui/material'

interface FileUploadProgressDisplayProps {
  currentFileUploadProgress: FileUploadProgress
  totalFilesToUpload: number
  uploadedFiles: number
}

export interface FileUploadProgress {
  fileName: string
  uploadProgress: number
}

export interface FailedFileUpload {
  fileName: string
  error: string
}

export default function FileUploadProgressDisplay({
  currentFileUploadProgress,
  totalFilesToUpload,
  uploadedFiles,
}: FileUploadProgressDisplayProps) {
  if (!currentFileUploadProgress) {
    return <Typography>Could not determine file progress</Typography>
  }
  if (uploadedFiles && uploadedFiles === totalFilesToUpload) {
    return <Typography>All files uploaded successfully.</Typography>
  }
  return currentFileUploadProgress.uploadProgress < 100 ? (
    <Stack direction='row' spacing={1}>
      <Typography fontWeight='bold'>
        [File {uploadedFiles ? uploadedFiles + 1 : '1'} / {totalFilesToUpload}] -
      </Typography>
      <Typography fontWeight='bold'>{currentFileUploadProgress.fileName}</Typography>
      <Typography>uploading {currentFileUploadProgress.uploadProgress}%</Typography>
    </Stack>
  ) : (
    <Stack direction='row' spacing={1}>
      <Typography fontWeight='bold'>
        File {uploadedFiles ? uploadedFiles + 1 : '1'} / {totalFilesToUpload} -{currentFileUploadProgress.fileName}
      </Typography>
      <Typography>received - waiting for response from server...</Typography>
    </Stack>
  )
}
