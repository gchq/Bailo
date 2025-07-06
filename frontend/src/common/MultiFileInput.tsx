import { Box } from '@mui/material'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import { ChangeEvent, useCallback, useMemo } from 'react'
import { FileInterface, FileWithMetadataAndTags } from 'types/types'
const Input = styled('input')({
  display: 'none',
})

type MultiFileInputProps = {
  label: string
  files: (File | FileInterface)[]
  filesMetadata: FileWithMetadataAndTags[]
  onFilesChange: (value: (File | FileInterface)[]) => void
  onFilesMetadataChange: (value: FileWithMetadataAndTags[]) => void
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
          ...newFiles.map((newFile) => ({ fileName: newFile.name, metadata: { text: '', tags: [] } })),
        ])
      }
    },
    [files, filesMetadata, onFilesChange, onFilesMetadataChange],
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
    </Box>
  )
}
