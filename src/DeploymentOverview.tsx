import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import MetadataDisplay from './MetadataDisplay'
import useTheme from '@mui/styles/useTheme'
import { lightTheme } from './theme'

const DeploymentOverview = (props: any) => {
  const { version } = props
  const theme: any = useTheme() || lightTheme

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: theme.palette.primary.main, color: 'white', borderRadius: 2 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Deployment name</Typography>
              <Typography variant='body1'>{version.metadata.highLevelDetails.name}</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Owner</Typography>
              <Typography variant='body1'>{version.metadata.contacts.requester}</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Point of Contact</Typography>
              <Typography variant='body1'>{version.metadata.contacts.secondPOC}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={8}>
          <MetadataDisplay item={version.metadata} tabsDisplaySequentially={true} use={'DEPLOYMENT'} />
        </Grid>
      </Grid>
    </>
  )
}

export default DeploymentOverview
