import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import EntitiesDisplay from '../components/EntitiesDisplay'
import { Deployment } from '../types/types'
import MetadataDisplay from './MetadataDisplay'

type DeploymentOverviewProps = {
  deployment: Deployment
}

function DeploymentOverview({ deployment }: DeploymentOverviewProps) {
  const theme = useTheme()

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Box sx={{ backgroundColor: theme.palette.primary.main, color: 'white', borderRadius: 2 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant='h6'>Deployment name</Typography>
            <Typography variant='body1'>{deployment.metadata.highLevelDetails.name}</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant='h6'>Owner</Typography>
            <Typography variant='body1'>
              <EntitiesDisplay entities={deployment.metadata.contacts.owner} />
            </Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} sm={8}>
        {!deployment.ungoverned && (
          <MetadataDisplay item={deployment.metadata} tabsDisplaySequentially use='DEPLOYMENT' />
        )}
        {deployment.ungoverned && (
          <Box
            sx={{ p: 4, backgroundColor: theme.palette.container.main, borderRadius: 2 }}
            data-test='metadataDisplay'
          >
            This is an ungoverned deployment and does not contain any additional metadata.
          </Box>
        )}
      </Grid>
    </Grid>
  )
}

export default DeploymentOverview
