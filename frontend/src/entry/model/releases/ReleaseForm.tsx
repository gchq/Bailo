import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModelCardRevisions } from 'actions/modelCard'
import { useGetReleasesForModelId } from 'actions/release'
import { ChangeEvent, useCallback, useMemo } from 'react'
import FileUploadProgressDisplay, { FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import HelpPopover from 'src/common/HelpPopover'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import MultiFileInput from 'src/common/MultiFileInput'
import MultiFileInputFileDisplay from 'src/common/MultiFileInputFileDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import FileDisplay from 'src/entry/model/files/FileDisplay'
import ModelImageList from 'src/entry/model/ModelImageList'
import ExistingFileSelector from 'src/entry/model/releases/ExistingFileSelector'
import ReadOnlyAnswer from 'src/Form/ReadOnlyAnswer'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import {
  EntryInterface,
  FileInterface,
  FileWithMetadataAndTags,
  FlattenedModelImage,
  isFileInterface,
} from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { isValidSemver } from 'utils/stringUtils'

type ReleaseFormData = {
  semver: string
  releaseNotes: string
  isMinorRelease: boolean
  files: (File | FileInterface)[]
  imageList: FlattenedModelImage[]
  modelCardVersion: number
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
  onModelCardVersionChange: (value: number) => void
  filesMetadata: FileWithMetadataAndTags[]
  onFilesMetadataChange: (value: FileWithMetadataAndTags[]) => void
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
  onModelCardVersionChange,
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

  const { releases, isReleasesLoading, isReleasesError, mutateReleases } = useGetReleasesForModelId(model.id)
  const { modelCardRevisions, isModelCardRevisionsLoading, isModelCardRevisionsError } = useGetModelCardRevisions(
    model.id,
  )

  const latestRelease = useMemo(() => (releases.length > 0 ? releases[0].semver : 'None'), [releases])

  const handleSemverChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSemverChange(event.target.value)
  }

  const handleMinorReleaseChange = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    onMinorReleaseChange(checked)
  }

  const handleModelCardVersionChange = useCallback(
    (event: SelectChangeEvent) => {
      const newModelCardVersion = parseInt(event.target.value)
      onModelCardVersionChange(newModelCardVersion)
    },
    [onModelCardVersionChange],
  )

  const releaseNotesLabel = (
    <Typography component='label' fontWeight='bold' htmlFor={'new-model-description'}>
      Release notes {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
    </Typography>
  )

  const modelCardVersionList = useMemo(() => {
    return modelCardRevisions.sort(sortByCreatedAtDescending).map((revision) => (
      <MenuItem key={revision.version} value={revision.version}>
        {revision.version}
      </MenuItem>
    ))
  }, [modelCardRevisions])

  const handleDeleteFile = (fileToDelete: File | FileInterface) => {
    if (formData.files) {
      const updatedFileList = formData.files.filter((file) => file.name !== fileToDelete.name)
      onFilesChange(updatedFileList)
    }
  }

  const handleMetadataChange = useCallback(
    (fileWithMetadata: FileWithMetadataAndTags) => {
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

  if (isModelCardRevisionsError) {
    return <MessageAlert message={isModelCardRevisionsError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2}>
      {isReadOnly && (
        <Stack>
          <Typography fontWeight='bold'>Latest version</Typography>
          <Typography noWrap>{isReleasesLoading ? 'Loading...' : latestRelease}</Typography>
        </Stack>
      )}
      <Stack overflow='hidden' spacing={2}>
        <Stack sx={{ width: '100%' }}>
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
        <Stack sx={{ width: '100%' }}>
          <Stack direction='row' spacing={1}>
            <Typography fontWeight='bold'>
              Model card version {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
            </Typography>
            {!isReadOnly && <HelpPopover>Leave this as default if you want the latest available version</HelpPopover>}
          </Stack>
          {isReadOnly ? (
            <Typography>
              {formData.modelCardVersion} -{' '}
              <Link href={`/${model.kind}/${model.id}/history/${formData.modelCardVersion}`}>
                <Button size='small'>View Model card</Button>
              </Link>
            </Typography>
          ) : (
            <>
              {isModelCardRevisionsLoading && <Loading />}
              {!isModelCardRevisionsLoading && (
                <>
                  <Select
                    size='small'
                    value={formData.modelCardVersion.toString()}
                    onChange={handleModelCardVersionChange}
                  >
                    {modelCardVersionList}
                  </Select>
                </>
              )}
            </>
          )}
        </Stack>
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
        <Accordion defaultExpanded sx={{ p: 0 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 0 }}>
            <Typography fontWeight='bold'>{`Files (${formData.files.length})`}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <>
              {!isReadOnly && (
                <Stack spacing={2}>
                  <Stack
                    spacing={2}
                    direction={{ xs: 'column', sm: 'row' }}
                    divider={<Divider flexItem orientation='vertical' />}
                  >
                    <ExistingFileSelector
                      model={model}
                      onChange={onFilesChange}
                      existingReleaseFiles={formData.files}
                    />
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
                      <FileUploadProgressDisplay
                        currentFileUploadProgress={currentFileUploadProgress}
                        uploadedFiles={uploadedFiles.length}
                        totalFilesToUpload={filesToUploadCount}
                      />
                    </>
                  )}
                  {formData.files.length > 0 && (
                    <Stack spacing={1} mt={1}>
                      {formData.files.map((file, index) => (
                        <div key={`${file.name}-${file.size}-${index}`}>
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
              <Stack spacing={1} divider={<Divider />}>
                {isReadOnly &&
                  formData.files.map(
                    (file) =>
                      isFileInterface(file) && (
                        <FileDisplay
                          key={file.name}
                          file={file}
                          modelId={model.id}
                          showMenuItems={{ rescanFile: true }}
                          mutator={mutateReleases}
                        />
                      ),
                  )}
              </Stack>
              {isReadOnly && formData.files.length === 0 && <ReadOnlyAnswer value='No files' />}
            </>
          </AccordionDetails>
        </Accordion>
      </Stack>
      <Box>
        <Accordion defaultExpanded sx={{ p: 0 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 0 }}>
            <Typography fontWeight='bold'>{`Images (${formData.imageList.length})`}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ModelImageList
              multiple
              model={model}
              value={formData.imageList}
              readOnly={isReadOnly}
              onChange={onImageListChange}
              onRegistryError={onRegistryError}
            />
            {isReadOnly && formData.imageList.length === 0 && <ReadOnlyAnswer value='No images' />}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Stack>
  )
}
