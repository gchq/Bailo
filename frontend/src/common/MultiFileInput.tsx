import { Box, Stack } from '@mui/material'
import Button from '@mui/material/Button'
import { styled } from '@mui/system'
import { ChangeEvent, useCallback, useMemo } from 'react'
import MultiFileInputFileDisplay from 'src/common/MultiFileInputFileDisplay'
import { FileWithMetadata } from 'types/interfaces'

const Input = styled('input')({
  display: 'none',
})

type MultiFileInputProps = {
  label: string
  files: File[]
  fileMetadata: FileWithMetadata[]
  onFileChange: (value: File[]) => void
  onFileMetadataChange: (value: FileWithMetadata[]) => void
  accepts?: string
  disabled?: boolean
  fullWidth?: boolean
  readOnly?: boolean
}

export default function MultiFileInput({
  label,
  onFileChange,
  fileMetadata,
  onFileMetadataChange,
  files,
  accepts = '',
  disabled = false,
  fullWidth = false,
  readOnly = false,
}: MultiFileInputProps) {
  const htmlId = useMemo(() => `${label.replace(/ /g, '-').toLowerCase()}-file`, [label])

  function handleDelete(fileToDelete: File) {
    if (files) {
      const updatedFileList = files.filter((file) => file.name !== fileToDelete.name)
      onFileChange(updatedFileList)
    }
  }

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newFiles = event.target.files ? Array.from(event.target.files) : []
      if (newFiles) {
        if (files) {
          const updatedFiles = newFiles.concat(
            files.filter((file) => !newFiles.some((newFile) => newFile.name === file.name)),
          )
          onFileChange(updatedFiles)
        } else {
          onFileChange(newFiles)
        }
      }
    },
    [files, onFileChange],
  )

  const handleFileDisplayChange = useCallback(
    (fileWithMetadata: FileWithMetadata) => {
      const tempFilesWithMetadata = fileMetadata
      const metadataIndex = fileMetadata.findIndex((artefact) => artefact.fileName === fileWithMetadata.fileName)
      if (metadataIndex === -1) {
        tempFilesWithMetadata.push(fileWithMetadata)
      } else {
        tempFilesWithMetadata[metadataIndex] = fileWithMetadata
      }
      onFileMetadataChange(tempFilesWithMetadata)
    },
    [fileMetadata, onFileMetadataChange],
  )

  return (
    <Box sx={{ ...(fullWidth && { width: '100%' }) }}>
      {!readOnly && (
        <>
          <label htmlFor={htmlId}>
            <Button fullWidth component='span' variant='outlined' disabled={disabled}>
              {label}
            </Button>
          </label>
          <Input multiple id={htmlId} type='file' onInput={handleFileChange} accept={accepts} disabled={disabled} />
        </>
      )}
      {files.length > 0 && (
        <Stack spacing={1} mt={2}>
          {files.map((file) => (
            <div key={file.name}>
              <MultiFileInputFileDisplay file={file} handleDelete={handleDelete} onChange={handleFileDisplayChange} />
            </div>
          ))}
        </Stack>
      )}
    </Box>
  )
}
