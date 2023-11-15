import { Box, Chip, Stack, TextField } from '@mui/material'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import { styled } from '@mui/system'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import { FileWithMetadata } from 'types/interfaces'

const Input = styled('input')({
  display: 'none',
})

const displayFilename = (filename: string) => {
  const parts = filename.split('.')
  const ext = parts.pop()
  const base = parts.join('.')
  return base.length > 12 ? `${base}...${ext}` : filename
}

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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
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
  }

  function handleFileDisplayChange(fileWithMetadata: FileWithMetadata) {
    const tempFilesWithMetadata = fileMetadata
    const metadataIndex = fileMetadata.findIndex((artefact) => artefact.fileName === fileWithMetadata.fileName)
    if (metadataIndex === -1) {
      tempFilesWithMetadata.push(fileWithMetadata)
    } else {
      tempFilesWithMetadata[metadataIndex] = fileWithMetadata
    }
    onFileMetadataChange(tempFilesWithMetadata)
  }

  return (
    <Box sx={{ ...(fullWidth && { width: '100%' }) }}>
      {!readOnly && (
        <Box mb={2}>
          <label htmlFor={htmlId}>
            <Button fullWidth component='span' variant='outlined' disabled={disabled}>
              {label}
            </Button>
          </label>
          <Input multiple id={htmlId} type='file' onInput={handleFileChange} accept={accepts} disabled={disabled} />
        </Box>
      )}
      <Stack spacing={1}>
        {files.map((file) => (
          <div key={file.name}>
            <MultiFileInputDisplay file={file} handleDelete={handleDelete} onChange={handleFileDisplayChange} />
          </div>
        ))}
      </Stack>
    </Box>
  )
}

interface MultiFileInputDisplayProps {
  file: File
  handleDelete: (file: File) => void
  onChange: (fileWithMetadata: FileWithMetadata) => void
}

function MultiFileInputDisplay({ file, handleDelete, onChange }: MultiFileInputDisplayProps) {
  const theme = useTheme()
  const [metadata, setMetadata] = useState('')

  const handleMetadataChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMetadata(event.target.value)
      onChange({ fileName: file.name, metadata })
    },
    [onChange, file.name, metadata],
  )

  return (
    <Box sx={{ border: 'solid', borderWidth: '0.5px', borderColor: theme.palette.primary.main }}>
      <Stack direction='row' alignItems='center' spacing={1} sx={{ m: 1 }}>
        <Chip color='primary' label={displayFilename(file.name)} onDelete={() => handleDelete(file)} />
        <TextField
          size='small'
          placeholder='Optional metadata'
          sx={{ width: '100%' }}
          value={metadata}
          onChange={handleMetadataChange}
        />
      </Stack>
    </Box>
  )
}
