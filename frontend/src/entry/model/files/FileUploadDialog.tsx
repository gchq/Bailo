import styled from '@emotion/styled'
import FileUpload from '@mui/icons-material/FileUpload'
import FolderOpen from '@mui/icons-material/FolderOpen'
import { Alert, Box, Button, Dialog, DialogContent, Divider, LinearProgress, Stack, Typography } from '@mui/material'
import { deleteEntryFile } from 'actions/entry'
import { postFileForModelId } from 'actions/file'
import { AxiosProgressEvent } from 'axios'
import { ChangeEvent, useCallback, useContext, useMemo, useRef, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import FileUploadProgressDisplay, { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import UiConfigContext from 'src/contexts/uiConfigContext'
import ConflictResolutionList, { ConflictAction } from 'src/entry/model/files/ConflictResolutionList'
import FileToBeUploaded from 'src/entry/model/files/FileToBeUploaded'
import MessageAlert from 'src/MessageAlert'
import {
  EntryInterface,
  EntryKind,
  FileInterface,
  FileUploadMetadata,
  FileUploadWithMetadata,
  ReleaseInterface,
} from 'types/types'
import { detectFileConflicts, FileConflict } from 'utils/fileTreeUtils'
import { plural } from 'utils/stringUtils'

interface FileUploadDialogProps {
  model: EntryInterface
  open: boolean
  onDialogClose: () => void
  mutateModelFiles: () => void
  uploadPath?: string
  existingFiles?: FileInterface[]
  releases?: ReleaseInterface[]
  onFilesUploaded?: (files: FileInterface[]) => void
}

const Input = styled('input')({
  display: 'none',
})

export default function FileUploadDialog({
  open,
  onDialogClose,
  model,
  mutateModelFiles,
  uploadPath = '',
  existingFiles = [],
  releases = [],
  onFilesUploaded,
}: FileUploadDialogProps) {
  const uiConfig = useContext(UiConfigContext)
  const [failedFileUploads, setFailedFileUploads] = useState<FailedFileUpload[]>([])
  const [isFilesUploading, setIsFilesUploading] = useState(false)
  const [filesToBeUploaded, setFilesToBeUpload] = useState<FileUploadWithMetadata[]>([])
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [showConflictStep, setShowConflictStep] = useState(false)
  const [detectedConflicts, setDetectedConflicts] = useState<FileConflict[]>([])
  const [conflictResolutions, setConflictResolutions] = useState<Map<string, ConflictAction>>(new Map())

  const handleAddNewFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const newFiles = event.target.files
        ? Array.from(event.target.files).map((newFile) => {
            // For folder uploads, webkitRelativePath contains the path relative to the selected folder.
            // For individual files, prepend the current browsing path if set.
            const fileUploadPath = newFile.webkitRelativePath
              ? uploadPath
                ? `${uploadPath}/${newFile.webkitRelativePath}`
                : newFile.webkitRelativePath
              : uploadPath
                ? `${uploadPath}/${newFile.name}`
                : undefined
            const dedupeKey = fileUploadPath || newFile.name
            return { file: newFile, uploadPath: fileUploadPath, _dedupeKey: dedupeKey }
          })
        : []
      const filteredNewFiles = newFiles.filter(
        (newFile) =>
          filesToBeUploaded.find(
            (existingFile) => (existingFile.uploadPath || existingFile.file.name) === newFile._dedupeKey,
          ) === undefined,
      )

      setFilesToBeUpload([...filteredNewFiles.map(({ _dedupeKey: _, ...rest }) => rest), ...filesToBeUploaded])
      // Reset input value so re-selecting the same folder works
      event.target.value = ''
    },
    [filesToBeUploaded, uploadPath],
  )

  const handleFileMetadataOnChange = useCallback(
    (metadata: FileUploadMetadata, fileName: string) => {
      setFilesToBeUpload(
        filesToBeUploaded.map((fileWithMetadata) =>
          fileWithMetadata.file.name === fileName
            ? {
                ...fileWithMetadata,
                metadata: {
                  text: metadata.text,
                  tags: metadata.tags,
                },
              }
            : fileWithMetadata,
        ),
      )
    },
    [filesToBeUploaded, setFilesToBeUpload],
  )

  const handleFileUpload = useCallback(
    async (filesToProcess: FileUploadWithMetadata[]) => {
      const failedFiles: FailedFileUpload[] = []
      const successfulFiles: FileInterface[] = []
      setIsFilesUploading(true)
      setFailedFileUploads([])

      // Build a map of files to overwrite so we can delete the old version first
      const overwriteMap = new Map<string, FileInterface>()
      for (const conflict of detectedConflicts) {
        const name = conflict.fileToUpload.uploadPath || conflict.fileToUpload.file.name
        if (conflictResolutions.get(name) === 'overwrite') {
          overwriteMap.set(name, conflict.existingFile)
        }
      }

      for (const fileItem of filesToProcess) {
        const uploadName = fileItem.uploadPath || fileItem.file.name
        const existingFile = overwriteMap.get(uploadName)

        // Delete the existing file before uploading the replacement
        if (existingFile) {
          try {
            const deleteRes = await deleteEntryFile(model.id, existingFile._id)
            if (!deleteRes.ok) {
              failedFiles.push({ fileName: fileItem.file.name, error: 'Failed to delete existing file for overwrite' })
              setFailedFileUploads((prev) => [
                ...prev,
                { fileName: fileItem.file.name, error: 'Failed to delete existing file for overwrite' },
              ])
              continue
            }
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to delete existing file'
            failedFiles.push({ fileName: fileItem.file.name, error: message })
            setFailedFileUploads((prev) => [...prev, { fileName: fileItem.file.name, error: message }])
            continue
          }
        }

        const handleUploadProgress = (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setCurrentFileUploadProgress({ fileName: fileItem.file.name, uploadProgress: percentCompleted })
          }
        }

        try {
          const fileUploadResponse = await postFileForModelId(
            model.id,
            fileItem.file,
            handleUploadProgress,
            fileItem.metadata,
            fileItem.uploadPath,
          )
          setCurrentFileUploadProgress(undefined)
          if (fileUploadResponse) {
            successfulFiles.push(fileUploadResponse.data.file)
            setUploadedFiles((prev) => [...prev, fileItem.file.name])
            setFilesToBeUpload((prev) => prev.filter((f) => f.file.name !== fileItem.file.name))
            mutateModelFiles()
          } else {
            setCurrentFileUploadProgress(undefined)
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unknown upload error'
          const failed = { fileName: fileItem.file.name, error: message }
          failedFiles.push(failed)
          setFailedFileUploads((prev) => [...prev, failed])
          setCurrentFileUploadProgress(undefined)
        }
      }
      if (successfulFiles.length > 0) {
        onFilesUploaded?.(successfulFiles)
      }
      setUploadedFiles([])
      setFailedFileUploads(failedFiles)
      setIsFilesUploading(false)
      if (failedFiles.length === 0) {
        onDialogClose()
        setFilesToBeUpload([])
      }
    },
    [model.id, mutateModelFiles, detectedConflicts, conflictResolutions, onDialogClose, onFilesUploaded],
  )

  const handleUploadClick = useCallback(() => {
    const { conflicts } = detectFileConflicts(filesToBeUploaded, existingFiles)
    if (conflicts.length > 0) {
      setDetectedConflicts(conflicts)
      const defaultResolutions = new Map<string, ConflictAction>()
      for (const conflict of conflicts) {
        const name = conflict.fileToUpload.uploadPath || conflict.fileToUpload.file.name
        defaultResolutions.set(name, 'skip')
      }
      setConflictResolutions(defaultResolutions)
      setShowConflictStep(true)
    } else {
      handleFileUpload(filesToBeUploaded)
    }
  }, [filesToBeUploaded, existingFiles, handleFileUpload])

  const handleConflictsResolved = useCallback(() => {
    const { nonConflicting } = detectFileConflicts(filesToBeUploaded, existingFiles)
    const overwriteFiles = detectedConflicts
      .filter((c) => {
        const name = c.fileToUpload.uploadPath || c.fileToUpload.file.name
        return conflictResolutions.get(name) === 'overwrite'
      })
      .map((c) => c.fileToUpload)
    setShowConflictStep(false)
    handleFileUpload([...nonConflicting, ...overwriteFiles])
  }, [filesToBeUploaded, existingFiles, detectedConflicts, conflictResolutions, handleFileUpload])

  const handleDeleteFileFromUploadList = useCallback(
    (fileName: string) => {
      setFilesToBeUpload(filesToBeUploaded.filter((file) => file.file.name !== fileName))
    },
    [filesToBeUploaded],
  )

  const fileListToUpload = useMemo(() => {
    return filesToBeUploaded.map((fileWithMetadata) => (
      <FileToBeUploaded
        key={fileWithMetadata.file.name}
        fileWithMetadata={fileWithMetadata}
        onFileMetadataChange={handleFileMetadataOnChange}
        onDelete={handleDeleteFileFromUploadList}
      />
    ))
  }, [filesToBeUploaded, handleFileMetadataOnChange, handleDeleteFileFromUploadList])

  const failedFileList = useMemo(
    () =>
      failedFileUploads.map((file) => (
        <div key={file.fileName}>
          <Box
            component='span'
            sx={{
              fontWeight: 'bold',
            }}
          >
            {file.fileName}
          </Box>
          {` - ${file.error}`}
        </div>
      )),
    [failedFileUploads],
  )

  return (
    <Dialog open={open} onClose={onDialogClose} maxWidth='md' fullWidth>
      <DialogContent>
        <Stack spacing={2}>
          {uploadPath && (
            <Alert severity='info'>
              Uploading to: <strong>{uploadPath}/</strong>
            </Alert>
          )}
          <Stack direction='row' spacing={2} sx={{ justifyContent: 'center' }}>
            <label htmlFor='add-files-button'>
              <Button loading={isFilesUploading} endIcon={<FileUpload />} component='span' variant='outlined'>
                Select files
              </Button>
            </label>
            <Button
              loading={isFilesUploading}
              endIcon={<FolderOpen />}
              variant='outlined'
              onClick={() => folderInputRef.current?.click()}
            >
              Select folder
            </Button>
          </Stack>
          {model.kind === EntryKind.UNTRUSTED_MODEL && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <MessageAlert
                message={uiConfig.untrustedModel.fileUploadGuidance}
                severity='warning'
                style={{ width: 'fit-content' }}
              />
            </Box>
          )}
          <Input multiple id='add-files-button' type='file' onChange={handleAddNewFiles} data-test='uploadFileButton' />
          <input
            ref={(el) => {
              folderInputRef.current = el
              if (el) {
                el.setAttribute('webkitdirectory', '')
              }
            }}
            type='file'
            style={{ display: 'none' }}
            onChange={handleAddNewFiles}
            data-test='uploadFolderButton'
          />
          {showConflictStep ? (
            <>
              <ConflictResolutionList
                conflicts={detectedConflicts}
                resolutions={conflictResolutions}
                releases={releases}
                onResolutionChange={(name, action) => {
                  setConflictResolutions((prev) => new Map(prev).set(name, action))
                }}
                onApplyAll={(action) => {
                  const updated = new Map<string, ConflictAction>()
                  for (const conflict of detectedConflicts) {
                    const name = conflict.fileToUpload.uploadPath || conflict.fileToUpload.file.name
                    updated.set(name, action)
                  }
                  setConflictResolutions(updated)
                }}
              />
              <Stack direction='row' spacing={1} sx={{ justifyContent: 'flex-end' }}>
                <Button variant='outlined' onClick={() => setShowConflictStep(false)}>
                  Back
                </Button>
                <Button variant='contained' onClick={handleConflictsResolved}>
                  Continue Upload
                </Button>
              </Stack>
            </>
          ) : (
            <>
              {filesToBeUploaded.length === 0 && <EmptyBlob text='No files selected.' />}
              {filesToBeUploaded.length > 0 && (
                <Typography
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  Files to upload
                </Typography>
              )}
              <Stack divider={<Divider />} spacing={1}>
                {fileListToUpload}
              </Stack>
              {currentFileUploadProgress && (
                <>
                  <LinearProgress
                    variant={currentFileUploadProgress.uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                    value={currentFileUploadProgress.uploadProgress}
                  />
                  <FileUploadProgressDisplay
                    currentFileUploadProgress={currentFileUploadProgress}
                    uploadedFiles={uploadedFiles.length}
                    totalFilesToUpload={filesToBeUploaded.length}
                  />
                </>
              )}
              <Box sx={{ width: '100%' }}>
                <Button
                  disabled={filesToBeUploaded.length === 0}
                  loading={isFilesUploading}
                  onClick={handleUploadClick}
                  variant='contained'
                  color='primary'
                  sx={{ maxWidth: 'fit-content', float: 'right' }}
                >
                  Upload files
                </Button>
              </Box>
            </>
          )}
          {failedFileUploads.length > 0 && (
            <Alert severity='error' sx={{ my: 2 }}>
              <Stack spacing={1}>
                <Typography>{`Unable to upload the following ${plural(failedFileUploads.length, 'file')}:`}</Typography>
                {failedFileList}
              </Stack>
            </Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
