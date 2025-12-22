import { Box, Button, Container, Stack } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { memoize } from 'lodash-es'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent, useState } from 'react'
import semver from 'semver'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import Restricted from 'src/common/Restricted'
import ReleaseDisplay from 'src/entry/model/releases/ReleaseDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { hasRole } from 'utils/roles'

type ReleasesProps = {
  model: EntryInterface
  currentUserRoles: string[]
  readOnly?: boolean
}

export default function Releases({ model, currentUserRoles, readOnly = false }: ReleasesProps) {
  const router = useRouter()
  const [latestRelease, setLatestRelease] = useState('')

  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)
  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles(model.card.schemaId)

  const ReleaseListItem = memoize(({ data }) => (
    <ReleaseDisplay
      key={data.semver}
      model={model}
      release={data}
      latestRelease={latestRelease}
      hideReviewBanner={
        !hasRole(
          currentUserRoles,
          reviewRoles.map((role) => role.shortName),
        ) || readOnly
      }
    />
  ))

  const onLatestReleaseChange = useEffectEvent((release: string) => {
    setLatestRelease(release)
  })

  useEffect(() => {
    if (model && releases.length > 0) {
      onLatestReleaseChange(semver.sort(releases.map((release) => release.semver))[releases.length - 1])
    }
  }, [latestRelease, model, releases])

  function handleDraftNewRelease() {
    router.push(`/model/${model.id}/release/new`)
  }

  if (isReleasesLoading || isReviewRolesLoading) {
    return <Loading />
  }

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isReviewRolesError) {
    return <MessageAlert message={isReviewRolesError.info.message} severity='error' />
  }

  return (
    <Container sx={{ my: 2 }}>
      <Stack spacing={4}>
        {!readOnly && (
          <Box display='flex'>
            <Box ml='auto'>
              <Restricted action='createRelease' fallback={<Button disabled>Draft new Release</Button>}>
                <Button
                  variant='outlined'
                  onClick={handleDraftNewRelease}
                  disabled={!model.card}
                  data-test='draftNewReleaseButton'
                >
                  Draft new release
                </Button>
              </Restricted>
            </Box>
          </Box>
        )}
        <Paginate
          list={releases.map((release) => {
            return { key: release._id, ...release }
          })}
          emptyListText={`No releases found for model ${model.name}`}
          searchFilterProperty='semver'
          sortingProperties={[
            { value: 'semver', title: 'Semver', iconKind: 'text' },
            { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
            { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
          ]}
          searchPlaceholderText='Search by version'
          defaultSortProperty='semver'
        >
          {ReleaseListItem}
        </Paginate>
      </Stack>
    </Container>
  )
}
