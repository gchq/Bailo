import { List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Link from 'src/Link'
import { ReleaseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

interface AssociatedReleasesListProps {
  releases: ReleaseInterface[]
  modelId: string
  latestRelease?: string
}

export default function AssociatedReleasesList({ releases, modelId }: AssociatedReleasesListProps) {
  const releaseList = useMemo(
    () =>
      releases.length > 0 ? (
        <List disablePadding>
          {releases.map((associatedRelease) => (
            <ListItem disablePadding key={associatedRelease._id}>
              <Link
                href={`/model/${modelId}/release/${associatedRelease.semver}`}
                sx={{ textDecoration: 'none', width: '100%' }}
              >
                <ListItemButton dense>
                  <ListItemText
                    primary={
                      <>
                        <Typography color='primary' component='span'>
                          {associatedRelease.semver}
                        </Typography>
                      </>
                    }
                    secondary={formatDateString(associatedRelease.createdAt)}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
      ) : (
        <EmptyBlob text='No Associated Releases' />
      ),
    [modelId, releases],
  )

  return <>{releaseList}</>
}
