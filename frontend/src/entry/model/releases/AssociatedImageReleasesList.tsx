import { List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Link from 'src/Link'
import { ReleaseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

interface AssociatedImageReleasesListProps {
  releases: ReleaseInterface[]
  modelId: string
  latestRelease: string
}

export default function AssociatedImageReleasesList({
  releases,
  modelId,
  latestRelease,
}: AssociatedImageReleasesListProps) {
  const content = useMemo(
    () =>
      releases.length > 0 ? (
        <List disablePadding>
          {releases.map((release) => (
            <ListItem disablePadding key={release._id}>
              <Link href={`/model/${modelId}/release/${release.semver}`} sx={{ textDecoration: 'none', width: '100%' }}>
                <ListItemButton dense>
                  <ListItemText
                    primary={
                      <>
                        <Typography color='primary' component='span'>
                          {release.semver}
                        </Typography>
                        {latestRelease === release.semver && (
                          <Typography color='secondary' component='span' pl={1}>
                            (Latest)
                          </Typography>
                        )}
                      </>
                    }
                    secondary={formatDateString(release.createdAt)}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
      ) : (
        <EmptyBlob text='No Associated Releases' />
      ),
    [latestRelease, modelId, releases],
  )

  return <>{content}</>
}
