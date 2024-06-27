import DeleteIcon from '@mui/icons-material/Delete'
import { Checkbox, FormControlLabel, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { ChangeEvent, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import ReleaseDisplay from 'src/entry/model/releases/ReleaseDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, ReleaseInterface } from 'types/types'

type ReleasesSelectorProps = {
  model: EntryInterface
  selectedReleases: ReleaseInterface[]
  setSelectedReleases: (values: ReleaseInterface[]) => void
}

export default function ReleaseSelector({ model, selectedReleases, setSelectedReleases }: ReleasesSelectorProps) {
  const [checked, setChecked] = useState(false)
  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const selectedReleasesDisplay = useMemo(() => {
    const handleRemoveRelease = async (removedRelease: ReleaseInterface) => {
      setChecked(false)
      setSelectedReleases(selectedReleases.filter((release) => release.semver !== removedRelease.semver))
    }
    return selectedReleases.map((release) => (
      <>
        <Grid item xs={10}>
          <ReleaseDisplay key={release.semver} model={model} release={release} hideReviewBanner />
        </Grid>
        <Grid item xs={2}>
          <Tooltip title={'Remove'}>
            <IconButton onClick={() => handleRemoveRelease(release)}>
              <DeleteIcon color={'error'} />
            </IconButton>
          </Tooltip>
        </Grid>
      </>
    ))
  }, [selectedReleases, model, setSelectedReleases])

  const handleChecked = async (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedReleases(event.target.checked ? releases : [])
    setChecked(event.target.checked)
  }

  if (isReleasesLoading) {
    return <Loading />
  }
  if (isReleasesError) {
    ;<MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  return (
    <>
      <Typography fontWeight='bold'>Select Releases</Typography>
      <FormControlLabel control={<Checkbox checked={checked} onChange={handleChecked} />} label='Select all' />
      <Grid container spacing={2} alignItems='center'>
        {selectedReleasesDisplay}
      </Grid>
    </>
  )
}
