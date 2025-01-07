import { Box, Stack } from '@mui/material'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import { ChangeEvent, useCallback, useMemo } from 'react'
import MultiFileInputFileDisplay from 'src/common/MultiFileInputFileDisplay'
import { FileInterface, FileWithMetadata } from 'types/types'

const Input = styled('input')({
  display: 'none',
})

type MultiFileInputProps = {
  label: string
  files: (File | FileInterface)[]
  filesMetadata: FileWithMetadata[]
  onFilesChange: (value: (File | FileInterface)[]) => void
  onFilesMetadataChange: (value: FileWithMetadata[]) => void
  accepts?: string
  disabled?: boolean
  fullWidth?: boolean
  readOnly?: boolean
}

export default function MultiFileInput({
  label,
  files,
  filesMetadata,
  onFilesChange,
  onFilesMetadataChange,
  accepts = '',
  disabled = false,
  fullWidth = false,
  readOnly = false,
}: MultiFileInputProps) {
  const htmlId = useMemo(() => `${label.replace(/ /g, '-').toLowerCase()}-file`, [label])

  function handleDeleteFile(fileToDelete: File | FileInterface) {
    if (files) {
      const updatedFileList = files.filter((file) => file.name !== fileToDelete.name)
      onFilesChange(updatedFileList)
    }
  }

  const handleAddFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newFiles = event.target.files ? Array.from(event.target.files) : []
      if (newFiles.length) {
        if (files) {
          const updatedFiles = [
            ...files.filter((file) => !newFiles.some((newFile) => newFile.name === file.name)),
            ...newFiles,
          ]
          onFilesChange(updatedFiles)
        } else {
          onFilesChange(newFiles)
        }
        onFilesMetadataChange([
          ...filesMetadata.filter(
            (fileMetadata) => !newFiles.some((newFile) => newFile.name === fileMetadata.fileName),
          ),
          ...newFiles.map((newFile) => ({ fileName: newFile.name, metadata: '' })),
        ])
      }
    },
    [files, filesMetadata, onFilesChange, onFilesMetadataChange],
  )

  const handleMetadataChange = useCallback(
    (fileWithMetadata: FileWithMetadata) => {
      const tempFilesWithMetadata = [...filesMetadata]
      const metadataIndex = filesMetadata.findIndex((artefact) => artefact.fileName === fileWithMetadata.fileName)
      if (metadataIndex === -1) {
        tempFilesWithMetadata.push(fileWithMetadata)
      } else {
        tempFilesWithMetadata[metadataIndex] = fileWithMetadata
      }
      onFilesMetadataChange(tempFilesWithMetadata)
    },
    [filesMetadata, onFilesMetadataChange],
  )

  return (
    <Box sx={[fullWidth ? { width: '100%' } : {}]}>
      {!readOnly && (
        <>
          <label htmlFor={htmlId}>
            <Button fullWidth component='span' variant='outlined' disabled={disabled}>
              {label}
            </Button>
          </label>
          <Input
            multiple
            id={htmlId}
            type='file'
            onInput={handleAddFile}
            accept={accepts}
            disabled={disabled}
            data-test='uploadFileButton'
          />
        </>
      )}
      {files.length > 0 && (
        <Stack spacing={1} mt={1}>
          {files.map((file) => (
            <div key={file.name}>
              <MultiFileInputFileDisplay
                file={file}
                readOnly={readOnly}
                onDelete={handleDeleteFile}
                onMetadataChange={handleMetadataChange}
              />
            </div>
          ))}
        </Stack>
      )}
    </Box>
  )
}
