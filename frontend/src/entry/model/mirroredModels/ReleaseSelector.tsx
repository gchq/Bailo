import ClearIcon from '@mui/icons-material/Clear'
import { Checkbox, FormControlLabel, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import ReleaseDisplay from 'src/entry/model/releases/ReleaseDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, ReleaseInterface } from 'types/types'

type ReleaseSelectorProps = {
  model: EntryInterface
  selectedReleases: ReleaseInterface[]
  onUpdateSelectedReleases: (values: ReleaseInterface[]) => void
  isReadOnly: boolean
  requiredRolesText: string
}

export default function ReleaseSelector({
  model,
  selectedReleases,
  onUpdateSelectedReleases,
  isReadOnly,
  requiredRolesText,
}: ReleaseSelectorProps) {
  const [checked, setChecked] = useState(false)
  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const handleRemoveRelease = useCallback(
    (removedRelease: ReleaseInterface) => {
      setChecked(false)
      onUpdateSelectedReleases(selectedReleases.filter((release) => release.semver !== removedRelease.semver))
    },
    [selectedReleases, onUpdateSelectedReleases],
  )

  const selectedReleasesDisplay = useMemo(() => {
    return selectedReleases.map((release) => (
      <>
        <Grid item xs={10}>
          <ReleaseDisplay key={release.semver} model={model} release={release} hideReviewBanner />
        </Grid>
        <Grid item xs={2}>
          <Tooltip title={'Remove'}>
            <IconButton onClick={() => handleRemoveRelease(release)}>
              <ClearIcon color={'error'} />
            </IconButton>
          </Tooltip>
        </Grid>
      </>
    ))
  }, [selectedReleases, model, handleRemoveRelease])

  const handleChecked = async (event: ChangeEvent<HTMLInputElement>) => {
    onUpdateSelectedReleases(event.target.checked ? releases : [])
    setChecked(event.target.checked)
  }

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isReleasesLoading) {
    return <Loading />
  }

  return (
    <>
      <Typography fontWeight='bold'>Select Releases</Typography>
      <Tooltip title={requiredRolesText}>
        <FormControlLabel
          control={<Checkbox checked={checked} disabled={isReadOnly} onChange={handleChecked} />}
          label='Select all'
        />
      </Tooltip>
      <Grid container spacing={2} alignItems='center'>
        {selectedReleasesDisplay}
      </Grid>
    </>
  )
}
