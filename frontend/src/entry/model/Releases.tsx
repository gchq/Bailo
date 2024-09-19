import { Box, Button, Container, Stack, Tooltip } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import ReleaseDisplay from 'src/entry/model/releases/ReleaseDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getRequiredRolesText, hasRole } from 'utils/roles'

type ReleasesProps = {
  model: EntryInterface
  currentUserRoles: string[]
  readOnly?: boolean
}

export default function Releases({ model, currentUserRoles, readOnly = false }: ReleasesProps) {
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
          hideReviewBanner={!hasRole(currentUserRoles, ['msro', 'mtr']) || readOnly}
        />
      )),
    [latestRelease, model, releases, currentUserRoles, readOnly],
  )

  const [canDraftRelease, requiredRolesText] = useMemo(() => {
    const validRoles = ['owner', 'mtr', 'msro', 'contributor']
    return [hasRole(currentUserRoles, validRoles), getRequiredRolesText(currentUserRoles, validRoles)]
  }, [currentUserRoles])

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
        {!readOnly && (
          <Tooltip title={requiredRolesText}>
            <Box sx={{ textAlign: 'right' }}>
              <Button
                variant='outlined'
                onClick={handleDraftNewRelease}
                disabled={!canDraftRelease || !model.card}
                data-test='draftNewReleaseButton'
              >
                Draft new Release
              </Button>
            </Box>
          </Tooltip>
        )}
        {isReleasesLoading && <Loading />}
        {releases.length === 0 && <EmptyBlob text={`No releases found for model ${model.name}`} />}
        {releaseDisplays}
      </Stack>
    </Container>
  )
}
