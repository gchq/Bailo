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
import MirrorInfo from 'src/common/MirrorInfo'
import Paginate from 'src/common/Paginate'
import renderQueryState from 'src/common/renderQueryState'
import ReleaseAssetsAccordion from 'src/entry/model/releases/ReleaseAssetsAccordion'
import ReleaseAssetsMainText from 'src/entry/model/releases/ReleaseAssetsMainText'
import ReleaseAccessRequestReviewSummary from 'src/entry/model/reviews/ReleaseAccessRequestReviewSummary'
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
        <Stack
          sx={{
            width: '100%',
          }}
        >
          <ListItemButton dense disabled={isAlreadySelected} onClick={handleToggle(release)}>
            <ListItemIcon>
              <Checkbox
                edge='start'
                checked={isAlreadySelected || isChecked}
                tabIndex={-1}
                disableRipple
                data-test={`releaseSelectorSemverCheckbox${release.semver}`}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Stack spacing={0.5}>
                  <ReleaseAssetsMainText
                    model={model}
                    release={release}
                    hideCopySemver
                    hideDescription
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
          <Stack
            spacing={1}
            sx={{
              padding: 2,
            }}
          >
            <ReleaseAssetsAccordion model={model} release={release} mode='readonly' />
            <ReleaseAccessRequestReviewSummary release={release} includeResponsesSummary={false} />
          </Stack>
        </Stack>
      </ListItem>
    )
  })

  const queryState = renderQueryState([isReleasesError], isReleasesLoading)
  if (queryState) {
    return queryState
  }

  return (
    <Stack
      spacing={2}
      sx={{
        width: '100%',
      }}
    >
      <Stack
        direction='row'
        spacing={0.5}
        sx={{
          marginBottom: 2,
          justifyContent: 'left',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
          }}
        >
          Releases to export
        </Typography>
        <HelpDialog title='Mirror Export Info' content={<MirrorInfo />} />
      </Stack>
      <Button
        variant='outlined'
        disabled={isReadOnly}
        onClick={() => setIsDialogOpen(true)}
        data-test='releaseSelectorSelectReleasesButton'
      >
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
          <Button
            onClick={handleAddReleases}
            disabled={checkedReleases.length === 0}
            variant='contained'
            data-test='releaseSelectorConfirmReleasesButton'
          >
            Add releases
          </Button>
        </DialogActions>
      </Dialog>
      {selectedReleases.length > 0 && (
        <Stack spacing={1}>
          <Typography variant='subtitle2'>Selected releases</Typography>
          <Stack
            direction='row'
            spacing={1}
            sx={{
              flexWrap: 'wrap',
            }}
          >
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
