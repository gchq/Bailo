import { Checkbox, FormControl, FormControlLabel, Grid, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetReleasesForModelId } from 'actions/release'
import prettyBytes from 'pretty-bytes'
import { ChangeEvent, useMemo } from 'react'
import HelpPopover from 'src/common/HelpPopover'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import MultiFileInput from 'src/common/MultiFileInput'
import RichTextEditor from 'src/common/RichTextEditor'
import ReadOnlyAnswer from 'src/Form/ReadOnlyAnswer'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import ModelImageList from 'src/model/ModelImageList'
import { FileInterface, FileWithMetadata, FlattenedModelImage, isFileInterface, ModelInterface } from 'types/types'
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
  model: ModelInterface
  formData: ReleaseFormData
  onSemverChange: (value: string) => void
  onReleaseNotesChange: (value: string) => void
  onMinorReleaseChange: (value: boolean) => void
  onFilesChange: (value: (File | FileInterface)[]) => void
  filesMetadata: FileWithMetadata[]
  onFilesMetadataChange: (value: FileWithMetadata[]) => void
  onImageListChange: (value: FlattenedModelImage[]) => void
  setRegistryError: (value: boolean) => void
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
  setRegistryError,
  editable = false,
  isEdit = false,
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
            inputProps={{ 'data-test': 'releaseSemanticVersionTextField' }}
            onChange={handleSemverChange}
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
          <MultiFileInput
            fullWidth
            label='Attach files'
            files={formData.files}
            filesMetadata={filesMetadata}
            readOnly={isReadOnly}
            onFilesChange={onFilesChange}
            onFilesMetadataChange={onFilesMetadataChange}
          />
        )}
        {isReadOnly &&
          formData.files.map((file) => (
            <>
              {isFileInterface(file) && (
                <Grid container spacing={1} alignItems='center' key={file.name}>
                  <Grid item xs={11}>
                    {isFileInterface(file) && (
                      <Tooltip title={file.name}>
                        <Link
                          href={`/api/v2/model/${model.id}/file/${file._id}/download`}
                          data-test={`fileLink-${file.name}`}
                        >
                          <Typography noWrap textOverflow='ellipsis'>
                            {file.name}
                          </Typography>
                        </Link>
                      </Tooltip>
                    )}
                  </Grid>
                  <Grid item xs={1} textAlign='right'>
                    <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
                  </Grid>
                </Grid>
              )}
            </>
          ))}
        {isReadOnly && formData.files.length === 0 && <ReadOnlyAnswer value='No files' />}
      </Stack>
      <Stack>
        <Typography fontWeight='bold'>Images</Typography>
        <ModelImageList
          model={model}
          value={formData.imageList}
          readOnly={isReadOnly}
          onChange={onImageListChange}
          setRegistryError={setRegistryError}
        />
        {isReadOnly && formData.imageList.length === 0 && <ReadOnlyAnswer value='No images' />}
      </Stack>
    </Stack>
  )
}
