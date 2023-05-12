import { SchemaSharp } from '@mui/icons-material'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import EntitiesDisplay from '../components/EntitiesDisplay'
import { useGetSchema } from '../data/schema'
import { ModelDoc, Version } from '../types/types'
import { printProperty } from '../utils/propertyUtils'
import ErrorWrapper from './errors/ErrorWrapper'
import MetadataDisplay from './MetadataDisplay'

type ModelOverviewProps = {
  version: Version
}

function ModelOverview({ version }: ModelOverviewProps) {
  const theme = useTheme()

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema((version.model as ModelDoc)?.schemaRef)

  if (isSchemaError) {
    return <ErrorWrapper message={isSchemaError.info.message} />
  }

  if (isSchemaLoading) {
    return null
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Box
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant='h6'>Model name</Typography>
            <Typography variant='body1'>{version.metadata.highLevelDetails.name}</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant='h6'>Model overview</Typography>
            <Typography variant='body1' style={{ whiteSpace: 'pre-wrap' }}>
              {printProperty(version.metadata.highLevelDetails.modelOverview)}
            </Typography>
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
                    key={`chip-${tag}`}
                    label={tag}
                    variant='outlined'
                    sx={{ color: 'white', borderColor: 'white' }}
                  />
                ))}
            </Box>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant='h6'>{schema?.schema.properties.contacts.properties.uploader.title}</Typography>

            <Typography variant='body1'>
              <EntitiesDisplay entities={version.metadata.contacts.uploader} />
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant='h6'>{schema?.schema.properties.contacts.properties.reviewer.title}</Typography>

            <Typography variant='body1'>
              <EntitiesDisplay entities={version.metadata.contacts.reviewer} />
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant='h6'>{schema?.schema.properties.contacts.properties.manager.title}</Typography>
            <Typography variant='body1'>
              <EntitiesDisplay entities={version.metadata.contacts.manager} />
            </Typography>
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
