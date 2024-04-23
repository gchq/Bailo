import { Box, Button, Container, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import { hasRole } from 'utils/roles'

import { useGetReleasesForModelId } from '../../actions/release'
import { ModelInterface } from '../../types/types'
import EmptyBlob from '../common/EmptyBlob'
import Loading from '../common/Loading'
import ReleaseDisplay from './releases/ReleaseDisplay'

type ReleasesProps = {
  model: ModelInterface
  currentUserRoles: string[]
}

export default function Releases({ model, currentUserRoles }: ReleasesProps) {
  const router = useRouter()
  const [latestRelease, setLatestRelease] = useState('')

  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const releaseDisplays = useMemo(
    () =>
      releases.map((release) => (
        <ReleaseDisplay
          key={release.semver}
          model={model}
          release={release}
          latestRelease={latestRelease}
          hideReviewBanner={!hasRole(currentUserRoles, ['msro', 'mtr'])}
        />
      )),
    [latestRelease, model, releases, currentUserRoles],
  )

  useEffect(() => {
    if (model && releases.length > 0) {
      setLatestRelease(releases[0].semver)
    }
  }, [model, releases])

  function handleDraftNewRelease() {
    router.push(`/model/${model.id}/release/new`)
  }

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  return (
    <Container sx={{ my: 2 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Button
            variant='outlined'
            onClick={handleDraftNewRelease}
            disabled={!model.card}
            data-test='draftNewReleaseButton'
          >
            Draft new Release
          </Button>
        </Box>
        {isReleasesLoading && <Loading />}
        {releases.length === 0 && <EmptyBlob text={`No releases found for model ${model.name}`} />}
        {releaseDisplays}
      </Stack>
    </Container>
  )
}
