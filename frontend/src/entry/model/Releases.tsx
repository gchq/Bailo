import Create from '@mui/icons-material/Create'
import { Box, Button, Container, Stack } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { memoize } from 'lodash-es'
import { useRouter } from 'next/router'
import semver from 'semver'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import Restricted from 'src/common/Restricted'
import ReleaseDisplay from 'src/entry/model/releases/ReleaseDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, ReleaseInterface } from 'types/types'

type ReleasesProps = {
  model: EntryInterface
  readOnly?: boolean
}

export function getLatestRelease(releases: ReleaseInterface[]) {
  if (releases.length > 0) {
    const ordered = semver.sort(releases.filter((release) => release.draft !== true).map((release) => release.semver))
    return ordered[ordered.length - 1]
  } else {
    return ''
  }
}

export default function Releases({ model, readOnly = false }: ReleasesProps) {
  const router = useRouter()

  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const ReleaseListItem = memoize(({ data }) => (
    <ReleaseDisplay key={data.semver} model={model} release={data} latestRelease={getLatestRelease(releases)} />
  ))

  function handleDraftNewRelease() {
    router.push(`/model/${model.id}/release/new`)
  }

  if (isReleasesLoading) {
    return <Loading />
  }

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  return (
    <Container sx={{ my: 2 }}>
      <Stack spacing={4}>
        {!readOnly && (
          <Box
            sx={{
              display: 'flex',
            }}
          >
            <Box
              sx={{
                ml: 'auto',
              }}
            >
              <Restricted action='createRelease' fallback={<Button disabled>Draft new Release</Button>}>
                <Button
                  variant='outlined'
                  onClick={handleDraftNewRelease}
                  disabled={!model.card}
                  data-test='draftNewReleaseButton'
                  startIcon={<Create />}
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
          prioritiseItems={(a, b) => Number(b.draft === true) - Number(a.draft === true)}
        >
          {ReleaseListItem}
        </Paginate>
      </Stack>
    </Container>
  )
}
