import ClearIcon from '@mui/icons-material/Clear'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { memoize } from 'lodash-es'
import { useCallback, useMemo, useState } from 'react'
import HelpDialog from 'src/common/HelpDialog'
import Loading from 'src/common/Loading'
import MirrorInfo from 'src/common/MirrorInfo'
import Paginate from 'src/common/Paginate'
import ReleaseAssetsAccordion from 'src/entry/model/releases/ReleaseAssetsAccordion'
import ReleaseAssetsMainText from 'src/entry/model/releases/ReleaseAssetsMainText'
import ReleaseAssetsResponses from 'src/entry/model/releases/ReleaseAssetsResponses'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, ReleaseInterface } from 'types/types'

type ReleaseSelectorProps = {
  model: EntryInterface
  selectedReleases: ReleaseInterface[]
  onUpdateSelectedReleases: (values: ReleaseInterface[]) => void
  isReadOnly: boolean
}

export default function ReleaseSelector({
  model,
  selectedReleases,
  onUpdateSelectedReleases,
  isReadOnly,
}: ReleaseSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [checkedReleases, setCheckedReleases] = useState<ReleaseInterface[]>([])

  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const selectedSemvers = useMemo(
    () => new Set(selectedReleases.map((selectedRelease) => selectedRelease.semver)),
    [selectedReleases],
  )

  const handleToggle = useCallback(
    (release: ReleaseInterface) => () => {
      const exists = checkedReleases.find((selectedRelease) => selectedRelease.semver === release.semver)
      if (exists) {
        setCheckedReleases(checkedReleases.filter((selectedRelease) => selectedRelease.semver !== release.semver))
      } else {
        setCheckedReleases([...checkedReleases, release])
      }
    },
    [checkedReleases],
  )

  const handleAddReleases = () => {
    if (checkedReleases.length === 0) {
      setIsDialogOpen(false)
      return
    }

    const merged = [
      ...selectedReleases,
      ...checkedReleases.filter((checkedRelease) => !selectedSemvers.has(checkedRelease.semver)),
    ]

    onUpdateSelectedReleases(merged)
    setCheckedReleases([])
    setIsDialogOpen(false)
  }

  const handleRemoveSelected = (semver: string) => {
    onUpdateSelectedReleases(selectedReleases.filter((selectedRelease) => selectedRelease.semver !== semver))
  }

  const ReleaseRow = memoize(({ data: release }: { data: ReleaseInterface }) => {
    const isAlreadySelected = selectedSemvers.has(release.semver)
    const isChecked = checkedReleases.some((checkedRelease) => checkedRelease.semver === release.semver)

    return (
      <ListItem key={release.semver} disablePadding>
        <Stack width='100%'>
          <ListItemButton dense disabled={isAlreadySelected} onClick={handleToggle(release)}>
            <ListItemIcon>
              <Checkbox edge='start' checked={isAlreadySelected || isChecked} tabIndex={-1} disableRipple />
            </ListItemIcon>
            <ListItemText
              primary={
                <Stack spacing={0.5}>
                  <ReleaseAssetsMainText
                    model={model}
                    release={release}
                    hideCopySemver={true}
                    hideDescription={true}
                    includeLinks={false}
                  />
                  {isAlreadySelected && (
                    <Typography variant='caption' color='error'>
                      This release has already been selected
                    </Typography>
                  )}
                </Stack>
              }
            />
          </ListItemButton>
          <Box>{(release.files.length > 0 || release.images.length > 0) && <Divider variant='middle' />}</Box>
          <Stack spacing={1} padding={2}>
            <ReleaseAssetsAccordion model={model} release={release} mode='readonly' />
            <ReleaseAssetsResponses model={model} release={release} includeResponses={false} />
          </Stack>
        </Stack>
      </ListItem>
    )
  })

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isReleasesLoading) {
    return <Loading />
  }

  return (
    <Stack spacing={2} width='100%'>
      <Stack direction='row' spacing={0.5} marginBottom={2} justifyContent='left' alignItems='center'>
        <Typography fontWeight='bold'>Select Releases</Typography>
        <HelpDialog title='Mirror Export Info' content={<MirrorInfo />} />
      </Stack>
      <Button variant='outlined' disabled={isReadOnly} onClick={() => setIsDialogOpen(true)}>
        Select releases
      </Button>
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Select releases for {model.name}</DialogTitle>
        <DialogContent sx={{ p: 1 }}>
          <Paginate
            list={releases}
            emptyListText='No releases found'
            defaultSortProperty='createdAt'
            searchFilterProperty='semver'
            searchPlaceholderText='Search by semver'
            sortingProperties={[
              { value: 'semver', title: 'Version', iconKind: 'text' },
              { value: 'createdAt', title: 'Created', iconKind: 'date' },
            ]}
          >
            {ReleaseRow}
          </Paginate>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          <Button onClick={handleAddReleases} disabled={checkedReleases.length === 0} variant='contained'>
            Add releases
          </Button>
        </DialogActions>
      </Dialog>
      {selectedReleases.length > 0 && (
        <Stack spacing={1}>
          <Typography variant='subtitle2'>Selected releases</Typography>
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            {selectedReleases.map((release) => (
              <Chip
                key={release.semver}
                label={release.semver}
                onDelete={isReadOnly ? undefined : () => handleRemoveSelected(release.semver)}
                deleteIcon={<ClearIcon />}
              />
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
