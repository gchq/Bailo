import {
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetReleasesForModelId } from 'actions/release'
import { ChangeEvent, useCallback, useMemo } from 'react'
import HelpPopover from 'src/common/HelpPopover'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import MultiFileInput from 'src/common/MultiFileInput'
import MultiFileInputFileDisplay from 'src/common/MultiFileInputFileDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import ModelImageList from 'src/entry/model/ModelImageList'
import ExistingFileSelector from 'src/entry/model/releases/ExistingFileSelector'
import FileDownload from 'src/entry/model/releases/FileDownload'
import ReadOnlyAnswer from 'src/Form/ReadOnlyAnswer'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface, FileUploadProgress, FileWithMetadata, FlattenedModelImage } from 'types/types'
import { isValidSemver } from 'utils/stringUtils'

type ReleaseFormData = {
  semver: string
  releaseNotes: string
  isMinorRelease: boolean
  files: (File | FileInterface)[]
  imageList: FlattenedModelImage[]
}

type EditableReleaseFormProps =
  | {
      editable: true
      isEdit: boolean
    }
  | {
      editable?: false
      isEdit?: false
    }

type ReleaseFormProps = {
  model: EntryInterface
  formData: ReleaseFormData
  onSemverChange: (value: string) => void
  onReleaseNotesChange: (value: string) => void
  onMinorReleaseChange: (value: boolean) => void
  onFilesChange: (value: (File | FileInterface)[]) => void
  filesMetadata: FileWithMetadata[]
  onFilesMetadataChange: (value: FileWithMetadata[]) => void
  onImageListChange: (value: FlattenedModelImage[]) => void
  onRegistryError: (value: boolean) => void
  currentFileUploadProgress?: FileUploadProgress
  uploadedFiles: string[]
  filesToUploadCount: number
} & EditableReleaseFormProps

export default function ReleaseForm({
  model,
  formData,
  onSemverChange,
  onReleaseNotesChange,
  onMinorReleaseChange,
  onFilesChange,
  filesMetadata,
  onFilesMetadataChange,
  onImageListChange,
  onRegistryError,
  editable = false,
  isEdit = false,
  currentFileUploadProgress,
  uploadedFiles,
  filesToUploadCount,
}: ReleaseFormProps) {
  const theme = useTheme()

  const isReadOnly = useMemo(() => editable && !isEdit, [editable, isEdit])

  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const latestRelease = useMemo(() => (releases.length > 0 ? releases[0].semver : 'None'), [releases])

  const handleSemverChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSemverChange(event.target.value)
  }

  const handleMinorReleaseChange = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    onMinorReleaseChange(checked)
  }

  const releaseNotesLabel = (
    <Typography component='label' fontWeight='bold' htmlFor={'new-model-description'}>
      Release Notes {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
    </Typography>
  )

  const fileProgressText = () => {
    if (!currentFileUploadProgress) {
      return <Typography>Could not determine file progress</Typography>
    }
    if (uploadedFiles && uploadedFiles.length === filesToUploadCount) {
      return <Typography>All files uploaded successfully.</Typography>
    }
    return currentFileUploadProgress.uploadProgress < 100 ? (
      <Stack direction='row' spacing={1}>
        <Typography fontWeight='bold'>
          [File {uploadedFiles ? uploadedFiles.length + 1 : '1'} / {filesToUploadCount}] -
        </Typography>
        <Typography fontWeight='bold'>{currentFileUploadProgress.fileName}</Typography>
        <Typography>uploading {currentFileUploadProgress.uploadProgress}%</Typography>
      </Stack>
    ) : (
      <Stack direction='row' spacing={1}>
        <Typography fontWeight='bold'>
          File {uploadedFiles && uploadedFiles.length + 1} / {filesToUploadCount} -{currentFileUploadProgress.fileName}
        </Typography>
        <Typography>received - waiting for response from server...</Typography>
      </Stack>
    )
  }

  const handleDeleteFile = (fileToDelete: File | FileInterface) => {
    if (formData.files) {
      const updatedFileList = formData.files.filter((file) => file.name !== fileToDelete.name)
      onFilesChange(updatedFileList)
    }
  }

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

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2}>
      {!editable && (
        <Stack sx={{ width: '100%' }} justifyContent='center'>
          <Stack direction='row'>
            <Typography fontWeight='bold'>Release name</Typography>
            {!editable && (
              <HelpPopover>
                The release name is automatically generated using the model name and release semantic version
              </HelpPopover>
            )}
          </Stack>
          <Typography>{`${model.name} - ${formData.semver}`}</Typography>
        </Stack>
      )}
      {!editable && (
        <Stack>
          <Typography fontWeight='bold'>Latest version</Typography>
          <Typography>{isReleasesLoading ? 'Loading...' : latestRelease}</Typography>
        </Stack>
      )}
      <Stack>
        <Typography fontWeight='bold'>
          Semantic version {!editable && <span style={{ color: theme.palette.error.main }}>*</span>}
        </Typography>
        {isReadOnly || isEdit ? (
          <ReadOnlyAnswer value={formData.semver} />
        ) : (
          <TextField
            required
            size='small'
            autoFocus={!isEdit}
            error={formData.semver !== '' && !isValidSemver(formData.semver)}
            helperText={formData.semver !== '' && !isValidSemver(formData.semver) ? 'Must follow format #.#.#' : ''}
            value={formData.semver}
            onChange={handleSemverChange}
            slotProps={{
              htmlInput: { 'data-test': 'releaseSemanticVersionTextField' },
            }}
          />
        )}
      </Stack>
      <Stack>
        {isReadOnly ? (
          <>
            {releaseNotesLabel}
            <MarkdownDisplay>{formData.releaseNotes}</MarkdownDisplay>
          </>
        ) : (
          <RichTextEditor
            value={formData.releaseNotes}
            onChange={onReleaseNotesChange}
            aria-label='Release notes'
            label={releaseNotesLabel}
            textareaProps={{ autoFocus: isEdit }}
            dataTest='releaseNotesInput'
          />
        )}
      </Stack>
      <Stack>
        {isReadOnly || isEdit ? (
          <>
            <Typography fontWeight='bold'>Minor Release</Typography>
            <ReadOnlyAnswer value={formData.isMinorRelease ? 'Yes' : 'No'} />
          </>
        ) : (
          <FormControl>
            <FormControlLabel
              control={<Checkbox size='small' checked={formData.isMinorRelease} onChange={handleMinorReleaseChange} />}
              label='Minor release - No significant changes, does not require release re-approval'
            />
          </FormControl>
        )}
      </Stack>
      <Stack>
        <Typography fontWeight='bold'>Files</Typography>
        {!isReadOnly && (
          <Stack spacing={2}>
            <Stack
              spacing={2}
              direction={{ xs: 'column', sm: 'row' }}
              divider={<Divider flexItem orientation='vertical' />}
            >
              <ExistingFileSelector model={model} onChange={onFilesChange} existingReleaseFiles={formData.files} />
              <MultiFileInput
                fullWidth
                label='Attach new files'
                files={formData.files}
                filesMetadata={filesMetadata}
                readOnly={isReadOnly}
                onFilesChange={onFilesChange}
                onFilesMetadataChange={onFilesMetadataChange}
              />
            </Stack>
            {currentFileUploadProgress && (
              <>
                <LinearProgress
                  variant={currentFileUploadProgress.uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                  value={currentFileUploadProgress.uploadProgress}
                />
                {fileProgressText()}
              </>
            )}
            {formData.files.length > 0 && (
              <Stack spacing={1} mt={1}>
                {formData.files.map((file) => (
                  <div key={file.name}>
                    <MultiFileInputFileDisplay
                      file={file}
                      readOnly={isReadOnly}
                      onDelete={handleDeleteFile}
                      onMetadataChange={handleMetadataChange}
                    />
                  </div>
                ))}
              </Stack>
            )}
          </Stack>
        )}
        <Stack>
          {isReadOnly && formData.files.map((file) => <FileDownload key={file.name} file={file} modelId={model.id} />)}
        </Stack>
        {isReadOnly && formData.files.length === 0 && <ReadOnlyAnswer value='No files' />}
      </Stack>
      <Stack>
        <Typography fontWeight='bold'>Images</Typography>
        <ModelImageList
          multiple
          model={model}
          value={formData.imageList}
          readOnly={isReadOnly}
          onChange={onImageListChange}
          onRegistryError={onRegistryError}
        />
        {isReadOnly && formData.imageList.length === 0 && <ReadOnlyAnswer value='No images' />}
      </Stack>
    </Stack>
  )
}
