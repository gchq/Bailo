import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import MetadataDisplay from './MetadataDisplay'
import useTheme from '@mui/styles/useTheme'

const ModelOverview = (props: any) => {
  const { version } = props
  const theme: any = useTheme()

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: theme.palette.primary.main, color: 'white', borderRadius: 2 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Model name</Typography>
              <Typography variant='body1'>{version.metadata.highLevelDetails.name}</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Model overview</Typography>
              <Typography variant='body1'>{version.metadata.highLevelDetails.modelOverview}</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Model tags</Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                }}
              >
                {version?.metadata?.highLevelDetails?.tags !== undefined && 
                  version?.metadata?.highLevelDetails?.tags.map((tag: any, index: number) => (
                    <Chip sx={{ color: 'white', m: 0.25 }} key={`chip-${index}`} label={tag} />
                  ))
                }
              </Box>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Uploader</Typography>
              <Typography variant='body1'>{version.metadata.contacts.uploader}</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Reviewer</Typography>
              <Typography variant='body1'>{version.metadata.contacts.reviewer}</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Manager</Typography>
              <Typography variant='body1'>{version.metadata.contacts.manager}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <MetadataDisplay item={version.metadata} tabsDisplaySequentially={true} use={'UPLOAD'} />
        </Grid>
      </Grid>
    </>
  )
}

export default ModelOverview
