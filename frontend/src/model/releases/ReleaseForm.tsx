import { Checkbox, FormControl, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { ChangeEvent, useMemo } from 'react'
import HelpPopover from 'src/common/HelpPopover'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import ModelImageList from 'src/common/ModelImageList'
import MultiFileInput from 'src/common/MultiFileInput'
import RichTextEditor from 'src/common/RichTextEditor'
import ReadOnlyAnswer from 'src/Form/ReadOnlyAnswer'
import MessageAlert from 'src/MessageAlert'
import { FileWithMetadata, FlattenedModelImage } from 'types/interfaces'
import { ModelInterface } from 'types/v2/types'
import { isValidSemver } from 'utils/stringUtils'

type ReleaseFormData = {
  semver: string
  releaseNotes: string
  isMinorRelease: boolean
  files: File[]
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
  onFilesChange: (value: File[]) => void
  filesMetadata: FileWithMetadata[]
  onFilesMetadataChange: (value: FileWithMetadata[]) => void
  onImageListChange: (value: FlattenedModelImage[]) => void
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
  editable = false,
  isEdit = false,
}: ReleaseFormProps) {
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
      Release Notes {!isReadOnly && <span style={{ color: 'red' }}>*</span>}
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
      <Stack>
        <Typography fontWeight='bold'>Latest version</Typography>
        <Typography>{isReleasesLoading ? 'Loading...' : latestRelease}</Typography>
      </Stack>
      <Stack>
        <Typography fontWeight='bold'>
          Semantic version {!editable && <span style={{ color: 'red' }}>*</span>}
        </Typography>
        {isReadOnly || isEdit ? (
          <ReadOnlyAnswer value={formData.semver} />
        ) : (
          <TextField
            required
            size='small'
            error={formData.semver !== '' && !isValidSemver(formData.semver)}
            helperText={formData.semver !== '' && !isValidSemver(formData.semver) ? 'Must follow format #.#.#' : ''}
            value={formData.semver}
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
        <MultiFileInput
          fullWidth
          disabled={isEdit} // TODO - Can be removed as part of BAI-1026
          label='Attach files'
          files={formData.files}
          filesMetadata={filesMetadata}
          readOnly={isReadOnly}
          onFileChange={onFilesChange}
          onFilesMetadataChange={onFilesMetadataChange}
        />
        {isReadOnly && formData.files.length === 0 && <ReadOnlyAnswer value='No files' />}
      </Stack>
      <Stack>
        <Typography fontWeight='bold'>Images</Typography>
        <ModelImageList model={model} value={formData.imageList} readOnly={isReadOnly} onChange={onImageListChange} />
        {isReadOnly && formData.imageList.length === 0 && <ReadOnlyAnswer value='No images' />}
      </Stack>
    </Stack>
  )
}
