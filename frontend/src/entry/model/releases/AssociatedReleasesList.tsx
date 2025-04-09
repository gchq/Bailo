import { List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Link from 'src/Link'
import { FileInterface, isFileInterface, ReleaseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

interface AssociatedReleasesListProps {
  releases: ReleaseInterface[]
  modelId: string
  latestRelease: string
  file: FileInterface | File
}

export default function AssociatedReleasesList({
  releases,
  modelId,
  latestRelease,
  file,
}: AssociatedReleasesListProps) {
  const releaseList = useMemo(
    () =>
      isFileInterface(file) && releases.length > 0 ? (
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
                        {latestRelease === associatedRelease.semver && (
                          <Typography color='secondary' component='span' pl={1}>
                            (Latest)
                          </Typography>
                        )}
                      </>
                    }
                    secondary={formatDateString(file.createdAt.toString())}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
      ) : (
        <EmptyBlob text='No Associated Releases' />
      ),
    [file, latestRelease, modelId, releases],
  )

  return <>{releaseList}</>
}
