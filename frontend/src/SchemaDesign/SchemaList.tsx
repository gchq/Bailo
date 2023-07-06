import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { SxProps, Theme, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import React, { useState } from 'react'

import { useGetSchemas } from '../../data/schema'
import { Schema } from '../../types/types'
import SchemaUploadDialog from './SchemaUploadDialog'

export default function SchemaList() {
  const {
    schemas: uploadSchemas,
    isSchemasLoading: isUploadSchemasLoading,
    mutateSchemas: mutateUploadSchemas,
  } = useGetSchemas('UPLOAD')
  const {
    schemas: deploymentSchemas,
    isSchemasLoading: isDeploymentSchemasLoading,
    mutateSchemas: mutateDeploymentSchemas,
  } = useGetSchemas('DEPLOYMENT')
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  const handleDialogClose = () => {
    setOpen(false)
    mutateUploadSchemas()
    mutateDeploymentSchemas()
  }

  const uploadStyling: SxProps<Theme> = {
    mb: 2,
    borderLeft: '.3rem solid #283593',
    p: 2,
    backgroundColor: theme.palette.container.main,
  }
  const deploymentStyling: SxProps<Theme> = {
    mb: 2,
    borderLeft: '.3rem solid #de3c30',
    p: 2,
    backgroundColor: theme.palette.container.main,
  }

  return (
    <>
      {!isUploadSchemasLoading && !isDeploymentSchemasLoading && (
        <>
          <Box sx={{ textAlign: 'right' }}>
            <Button variant='contained' onClick={() => setOpen(true)}>
              Upload a new schema
            </Button>
          </Box>

          <Paper sx={{ my: 2, p: 2 }}>
            <Typography variant='h4'>Schema List</Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant='h6'>Upload Schemas</Typography>
              {uploadSchemas &&
                uploadSchemas.map((uploadSchema) => (
                  <Box sx={{ mt: 2 }} key={uploadSchema.reference}>
                    <SchemaListItem schema={uploadSchema} styling={uploadStyling} />
                  </Box>
                ))}
            </Box>
            <Box sx={{ my: 2 }}>
              <Typography variant='h6'>Deployment Schemas</Typography>
              {deploymentSchemas &&
                deploymentSchemas.map((deploymentSchema) => (
                  <Box sx={{ mt: 2 }} key={deploymentSchema.reference}>
                    <SchemaListItem schema={deploymentSchema} styling={deploymentStyling} />
                  </Box>
                ))}
            </Box>
          </Paper>
          <SchemaUploadDialog open={open} handleDialogClose={handleDialogClose} />
        </>
      )}
      {(isUploadSchemasLoading || isDeploymentSchemasLoading) && <Typography>Loading...</Typography>}
    </>
  )
}

function SchemaListItem({ schema, styling }: { schema: Schema; styling: SxProps<Theme> }) {
  const theme = useTheme()
  return (
    <Box sx={{ px: 3 }} key={schema.reference}>
      <Stack direction='row' spacing={1} sx={styling} justifyContent='space-between'>
        <Typography
          variant='h5'
          sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
        >
          {schema.name}
        </Typography>
        <Box>
          <Button disabled color='secondary' variant='outlined' sx={{ mr: 1 }}>
            Edit
          </Button>
          <Button disabled variant='contained'>
            Disable
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
