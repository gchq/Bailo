import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import FolderOpen from '@mui/icons-material/FolderOpen'
import { Box, ButtonGroup, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from '@mui/material'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react'
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
  const [splitMenuAnchor, setSplitMenuAnchor] = useState<HTMLElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleAddFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawFiles = event.target.files ? Array.from(event.target.files) : []
      // For folder uploads, use webkitRelativePath as the file name so paths are preserved
      const newFiles = rawFiles.map((file) => {
        if (file.webkitRelativePath) {
          Object.defineProperty(file, 'name', { value: file.webkitRelativePath, writable: false })
        }
        return file
      })
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
      event.target.value = ''
    },
    [files, filesMetadata, onFilesChange, onFilesMetadataChange],
  )

  return (
    <Box sx={{ ...(fullWidth && { width: '100%' }) }}>
      {!readOnly && (
        <>
          <ButtonGroup variant='outlined' fullWidth={fullWidth} disabled={disabled}>
            <label htmlFor={htmlId} style={{ flex: 1 }}>
              <Button fullWidth component='span' disabled={disabled}>
                {label}
              </Button>
            </label>
            <Button
              size='small'
              onClick={(e) => setSplitMenuAnchor(splitMenuAnchor ? null : e.currentTarget)}
              disabled={disabled}
              aria-label='Select upload type'
            >
              <ArrowDropDown />
            </Button>
          </ButtonGroup>
          <Popper
            open={Boolean(splitMenuAnchor)}
            anchorEl={splitMenuAnchor}
            transition
            disablePortal
            sx={{ zIndex: 1 }}
          >
            {({ TransitionProps }) => (
              <Grow {...TransitionProps}>
                <Paper>
                  <ClickAwayListener onClickAway={() => setSplitMenuAnchor(null)}>
                    <MenuList>
                      <MenuItem
                        onClick={() => {
                          setSplitMenuAnchor(null)
                          folderInputRef.current?.click()
                        }}
                      >
                        <FolderOpen sx={{ mr: 1 }} fontSize='small' />
                        Select folder
                      </MenuItem>
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
          <Input
            multiple
            id={htmlId}
            type='file'
            onChange={handleAddFile}
            accept={accepts}
            disabled={disabled}
            data-test='uploadFileButton'
          />
          {/* @ts-expect-error webkitdirectory is a non-standard attribute for folder selection */}
          <input
            ref={folderInputRef}
            type='file'
            style={{ display: 'none' }}
            onChange={handleAddFile}
            disabled={disabled}
            data-test='uploadFolderButton'
            webkitdirectory=''
            directory=''
          />
        </>
      )}
    </Box>
  )
}
