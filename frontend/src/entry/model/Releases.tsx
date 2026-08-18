import Create from '@mui/icons-material/Create'
import { Box, Button, Container, Stack } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { memoize } from 'lodash-es'
import { useRouter } from 'next/router'
import semver from 'semver'
import Paginate from 'src/common/Paginate'
import renderQueryState from 'src/common/renderQueryState'
import Restricted from 'src/common/Restricted'
import ReleaseDisplay from 'src/entry/model/releases/ReleaseDisplay'
import { EntryInterface } from 'types/types'

type ReleasesProps = {
  model: EntryInterface
  readOnly?: boolean
}

export default function Releases({ model, readOnly = false }: ReleasesProps) {
  const router = useRouter()

  function getLatestRelease() {
    if (model && releases.length > 0) {
      return semver.sort(releases.map((release) => release.semver))[releases.length - 1]
    } else {
      return ''
    }
  }

  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const ReleaseListItem = memoize(({ data }) => (
    <ReleaseDisplay key={data.semver} model={model} release={data} latestRelease={getLatestRelease()} />
  ))

  function handleDraftNewRelease() {
    router.push(`/model/${model.id}/release/new`)
  }

  const queryState = renderQueryState([isReleasesError], isReleasesLoading)
  if (queryState) {
    return queryState
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
        >
          {ReleaseListItem}
        </Paginate>
      </Stack>
    </Container>
  )
}
