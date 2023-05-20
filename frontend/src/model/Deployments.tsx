import { Alert, Box, Chip, CircularProgress } from '@mui/material'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useGetModelDeployments } from 'data/model'
import Link from 'next/link'
import EmptyBlob from 'src/common/EmptyBlob'
import UserAvatar from 'src/common/UserAvatar'
import { Deployment, Entity, Version } from 'types/types'

interface Props {
  version: Version
}

export default function Deployments({ version }: Props) {
  const theme = useTheme()

  if (!('uuid' in version.model)) {
    throw new Error('Deployments requires a version with a populated model field.')
  }

  const { deployments, isDeploymentsLoading, isDeploymentsError } = useGetModelDeployments(version.model.uuid)

  if (isDeploymentsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isDeploymentsError || !deployments) {
    return <Alert severity='error'>Failed to load deployments...</Alert>
  }

  return (
    <>
      {deployments.length === 0 && <EmptyBlob text='No deployments here' />}
      {deployments.map((deployment: Deployment) => (
        <Box key={`deployment-${deployment.uuid}`}>
          <Link href={`/deployment/${deployment.uuid}`} passHref legacyBehavior>
            <MuiLink
              variant='h5'
              sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
            >
              {deployment.metadata.highLevelDetails.name}
            </MuiLink>
          </Link>

          <Box sx={{ mb: 1 }}>
            <Stack direction='row'>
              <Typography variant='subtitle2' sx={{ mt: 'auto', mb: 'auto', mr: 1 }}>
                Contacts:
              </Typography>
              {deployment.metadata.contacts.owner.map((owner: Entity) => (
                <Chip
                  key={owner.id}
                  color='primary'
                  avatar={<UserAvatar entity={owner} size='chip' />}
                  label={owner.id}
                />
              ))}
            </Stack>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 1 }} />
        </Box>
      ))}
    </>
  )
}
