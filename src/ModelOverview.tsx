import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import useTheme from '@mui/styles/useTheme'
import { lightTheme } from './theme'
import MetadataDisplay from './MetadataDisplay'

function ModelOverview(props: any) {
  const { version } = props
  const theme: any = useTheme() || lightTheme

  return (
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
                version?.metadata?.highLevelDetails?.tags.map((tag: any) => (
                  <Chip
                    sx={{
                      color: theme.palette.mode === 'light' ? 'white' : 'primary',
                      backgroundColor: 'primary',
                    }}
                    key={`chip-${tag}`}
                    label={tag}
                    variant='outlined'
                  />
                ))}
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
        <MetadataDisplay item={version.metadata} tabsDisplaySequentially use='UPLOAD' />
      </Grid>
    </Grid>
  )
}

export default ModelOverview
