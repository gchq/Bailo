import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FileUpload from '@mui/icons-material/FileUpload'
import Folder from '@mui/icons-material/Folder'
import MoreVert from '@mui/icons-material/MoreVert'
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline'
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
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetFilesForModel } from 'actions/file'
import { useGetEntryCardRevisions } from 'actions/modelCard'
import { useGetReleasesForModelId } from 'actions/release'
import { ChangeEvent, useCallback, useContext, useMemo, useState } from 'react'
import FolderNavigableList from 'src/common/FolderNavigableList'
import HelpPopover from 'src/common/HelpPopover'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import UiConfigContext from 'src/contexts/uiConfigContext'
import FileBrowser from 'src/entry/model/files/FileBrowser'
import FileDisplay, { MutateReleases } from 'src/entry/model/files/FileDisplay'
import FileUploadDialog from 'src/entry/model/files/FileUploadDialog'
import ModelImageList from 'src/entry/model/ModelImageList'
import ExistingFileSelector from 'src/entry/model/releases/ExistingFileSelector'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import ReadOnlyAnswer from 'src/Form/ReadOnlyAnswer'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, EntryKind, FileInterface, FlattenedModelImage, ReleaseInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { formatDateString } from 'utils/dateUtils'
import { collectAllFiles, type FileTreeNode } from 'utils/fileTreeUtils'
import { isValidSemver } from 'utils/stringUtils'

export type ReleaseFormData = {
  semver: string
  releaseNotes: string
  isMinorRelease: boolean
  files: FileInterface[]
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
  onFilesChange: (value: FileInterface[]) => void
  onModelCardVersionChange: (value: number) => void
  onImageListChange: (value: FlattenedModelImage[]) => void
  onRegistryError: (value: boolean) => void
} & EditableReleaseFormProps

export default function ReleaseForm({
  model,
  formData,
  onSemverChange,
  onReleaseNotesChange,
  onMinorReleaseChange,
  onFilesChange,
  onModelCardVersionChange,
  onImageListChange,
  onRegistryError,
  editable = false,
  isEdit = false,
}: ReleaseFormProps) {
  const uiConfig = useContext(UiConfigContext)
  const theme = useTheme()

  const isReadOnly = useMemo(() => editable && !isEdit, [editable, isEdit])

  const { releases, isReleasesLoading, isReleasesError, mutateReleases } = useGetReleasesForModelId(model.id)
  const { files: modelFiles, mutateFiles } = useGetFilesForModel(model.id)
  const { entryCardRevisions, isEntryCardRevisionsLoading, isEntryCardRevisionsError } = useGetEntryCardRevisions(
    model.id,
  )

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

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

  const handleFilesUploaded = useCallback(
    (uploadedFiles: FileInterface[]) => {
      const existingIds = new Set(formData.files.map((f) => f._id))
      const newFiles = uploadedFiles.filter((f) => !existingIds.has(f._id))
      if (newFiles.length > 0) {
        onFilesChange([...formData.files, ...newFiles])
      }
    },
    [formData.files, onFilesChange],
  )

  const handleRemoveFile = useCallback(
    (fileToRemove: FileInterface) => {
      onFilesChange(formData.files.filter((f) => f._id !== fileToRemove._id))
    },
    [formData.files, onFilesChange],
  )

  const handleRemoveFolderFiles = useCallback(
    (node: FileTreeNode) => {
      const folderFiles = collectAllFiles(node)
      const folderIds = new Set(folderFiles.map((f) => f._id))
      onFilesChange(formData.files.filter((f) => !folderIds.has(f._id)))
    },
    [formData.files, onFilesChange],
  )

  const releaseNotesLabel = (
    <Typography
      component='label'
      htmlFor='release-notes-input'
      sx={{
        fontWeight: 'bold',
      }}
    >
      Release notes {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
    </Typography>
  )

  const modelCardVersionList = useMemo(() => {
    return entryCardRevisions.sort(sortByCreatedAtDescending).map((revision) => (
      <MenuItem key={revision.version} value={revision.version}>
        <Stack
          direction='row'
          spacing={1}
          sx={{
            alignItems: 'center',
          }}
        >
          <Typography>{revision.version} -</Typography>
          <Typography variant='caption'>{formatDateString(revision.createdAt)}</Typography>
        </Stack>
      </MenuItem>
    ))
  }, [entryCardRevisions])

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isEntryCardRevisionsError) {
    return <MessageAlert message={isEntryCardRevisionsError.info.message} severity='error' />
  }

  const error = MultipleErrorWrapper('Unable to load release form', {
    isModelCardRevisionsError: isEntryCardRevisionsError,
    isReleasesError,
  })
  if (error) {
    return error
  }

  return (
    <Stack spacing={2}>
      {isReadOnly && (
        <Stack>
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
          >
            Latest version
          </Typography>
          <Typography noWrap>{isReleasesLoading ? 'Loading...' : latestRelease}</Typography>
        </Stack>
      )}
      <Stack
        spacing={2}
        sx={{
          overflow: 'hidden',
        }}
      >
        <Stack sx={{ width: '100%' }}>
          <Typography
            component='label'
            htmlFor='semantic-version-input'
            sx={{
              fontWeight: 'bold',
            }}
          >
            Semantic version {!editable && <span style={{ color: theme.palette.error.main }}>*</span>}
          </Typography>
          <Typography variant='caption'>For example: 1.0.0</Typography>
          {isReadOnly || isEdit ? (
            <ReadOnlyAnswer value={formData.semver} />
          ) : (
            <TextField
              id='semantic-version-input'
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
            <Typography
              component='label'
              htmlFor='model-card-version-input'
              sx={{
                fontWeight: 'bold',
              }}
            >
              Model card version {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
            </Typography>
            {!isReadOnly && <HelpPopover>Leave this as default if you want the latest available version.</HelpPopover>}
          </Stack>
          {isReadOnly ? (
            <Typography>
              {formData.modelCardVersion} -{' '}
              <Link
                href={`/model/${model.id}/history/${formData.modelCardVersion}${model.kind === EntryKind.MIRRORED_MODEL ? '?mirrored=true' : ''}`}
              >
                <Button size='small'>View Model card</Button>
              </Link>
            </Typography>
          ) : (
            <>
              {isEntryCardRevisionsLoading && <Loading />}
              {!isEntryCardRevisionsLoading && (
                <>
                  <Select
                    size='small'
                    defaultValue={model.card.version.toString()}
                    value={
                      formData.modelCardVersion ? formData.modelCardVersion.toString() : model.card.version.toString()
                    }
                    onChange={handleModelCardVersionChange}
                    inputProps={{
                      id: 'model-card-version-input',
                    }}
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
            textareaProps={{ autoFocus: isEdit, id: 'release-notes-input' }}
            dataTest='releaseNotesInput'
          />
        )}
      </Stack>
      <Stack>
        {isReadOnly || isEdit ? (
          <>
            <Typography
              sx={{
                fontWeight: 'bold',
              }}
            >
              Minor Release
            </Typography>
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
            <Typography
              sx={{
                fontWeight: 'bold',
              }}
            >{`Files (${formData.files.length})`}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {!isReadOnly && model.kind === EntryKind.UNTRUSTED_MODEL && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <MessageAlert
                  message={uiConfig.untrustedModel.fileUploadGuidance}
                  severity='warning'
                  style={{ width: 'fit-content' }}
                />
              </Box>
            )}
            {!isReadOnly && (
              <Stack spacing={2}>
                <Stack
                  spacing={2}
                  direction={{ xs: 'column', sm: 'row' }}
                  divider={<Divider flexItem orientation='vertical' />}
                >
                  <ExistingFileSelector
                    files={modelFiles}
                    model={model}
                    onChange={onFilesChange}
                    existingReleaseFiles={formData.files}
                  />
                  <Button
                    variant='outlined'
                    sx={{ width: '100%' }}
                    endIcon={<FileUpload />}
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    Upload new files
                  </Button>
                </Stack>
                <FileUploadDialog
                  model={model}
                  open={isUploadDialogOpen}
                  onDialogClose={() => setIsUploadDialogOpen(false)}
                  mutateModelFiles={mutateFiles}
                  onFilesUploaded={handleFilesUploaded}
                />
                {formData.files.length > 0 && (
                  <ReleaseFileBrowser
                    files={formData.files}
                    modelId={model.id}
                    releases={releases}
                    mutateReleases={mutateReleases}
                    onRemoveFile={handleRemoveFile}
                    onRemoveFolderFiles={handleRemoveFolderFiles}
                  />
                )}
              </Stack>
            )}
            {isReadOnly && (
              <FileBrowser
                files={formData.files}
                modelId={model.id}
                modelKind={model.kind}
                releases={releases}
                mutator={mutateReleases}
                readOnly
              />
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>
      {model.kind !== EntryKind.UNTRUSTED_MODEL && (
        <Box>
          <Accordion defaultExpanded sx={{ p: 0 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 0 }}>
              <Typography
                sx={{ fontWeight: 'bold' }}
                component='label'
                htmlFor='image-input'
              >{`Images (${formData.imageList.length})`}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ModelImageList
                multiple
                model={model}
                value={formData.imageList}
                readOnly={isReadOnly}
                onChange={onImageListChange}
                onRegistryError={onRegistryError}
                id='image-input'
              />
              {isReadOnly && formData.imageList.length === 0 && <ReadOnlyAnswer value='No images' />}
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Stack>
  )
}

function ReleaseFileBrowser({
  files,
  modelId,
  releases,
  mutateReleases,
  onRemoveFile,
  onRemoveFolderFiles,
}: {
  files: FileInterface[]
  modelId: string
  releases: ReleaseInterface[]
  mutateReleases: MutateReleases
  onRemoveFile: (file: FileInterface) => void
  onRemoveFolderFiles: (node: FileTreeNode) => void
}) {
  return (
    <FolderNavigableList files={files}>
      {({ data, onNavigate }) => {
        if (data.kind === 'folder') {
          return <ReleaseFormFolderRow node={data.node} onNavigate={onNavigate} onRemove={onRemoveFolderFiles} />
        }
        return (
          <ReleaseFormFileRow
            file={data.file}
            modelId={modelId}
            releases={releases}
            mutateReleases={mutateReleases}
            onRemove={onRemoveFile}
          />
        )
      }}
    </FolderNavigableList>
  )
}

function ReleaseFormFolderRow({
  node,
  onNavigate,
  onRemove,
}: {
  node: FileTreeNode
  onNavigate: (path: string) => void
  onRemove: (node: FileTreeNode) => void
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const totalCount = node.totalFileCount

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={1} sx={{ p: 2 }}>
        <Stack
          direction={{ sm: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
        >
          <Stack
            direction='row'
            spacing={2}
            sx={{ alignItems: 'center', cursor: 'pointer', flex: 1 }}
            onClick={() => onNavigate(node.fullPath)}
          >
            <Folder color='action' />
            <Typography variant='h6'>{node.name}</Typography>
            <Typography variant='caption' sx={{ width: 'max-content' }}>
              {`${totalCount} file${totalCount !== 1 ? 's' : ''}`}
            </Typography>
          </Stack>
          <Tooltip title='More options'>
            <IconButton size='small' onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVert />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={() => {
                setAnchorEl(null)
                onRemove(node)
              }}
            >
              <ListItemIcon>
                <RemoveCircleOutline color='error' fontSize='small' />
              </ListItemIcon>
              <ListItemText>Remove folder from release</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>
    </Box>
  )
}

function ReleaseFormFileRow({
  file,
  modelId,
  releases,
  mutateReleases,
  onRemove,
}: {
  file: FileInterface
  modelId: string
  releases: ReleaseInterface[]
  mutateReleases: MutateReleases
  onRemove: (file: FileInterface) => void
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction='row' spacing={1} sx={{ p: 2, alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <FileDisplay
            file={file}
            modelId={modelId}
            releases={releases}
            mutator={mutateReleases}
            showMenuItems={{}}
            displayName={file.name.includes('/') ? file.name.split('/').pop() : undefined}
          />
        </Box>
        <Tooltip title='More options'>
          <IconButton size='small' onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem
            onClick={() => {
              setAnchorEl(null)
              onRemove(file)
            }}
          >
            <ListItemIcon>
              <RemoveCircleOutline color='error' fontSize='small' />
            </ListItemIcon>
            <ListItemText>Remove from release</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  )
}
