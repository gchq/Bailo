import React from 'react'

import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import Button from '@mui/material/Button'

import { useGetModelById, useGetModelVersions } from '../data/model'
import { Deployment, ModelUploadType } from '../types/interfaces'
import { ModelDoc } from '../server/models/Model'
import EmptyBlob from './common/EmptyBlob'

function RawModelExportList({ deployment }: { deployment: Deployment }) {
  const modelFromDeployment: ModelDoc = deployment.model as ModelDoc
  const { model } = useGetModelById(modelFromDeployment._id.toString())
  const { versions } = useGetModelVersions(model?.uuid)

  return (
    <>
      {versions &&
        versions.map((version: any) => (
          <Box key={version.version}>
            <Box sx={{ p: 1 }}>
              <Box sx={{ p: 2 }}>
                <Typography variant='h4'>Version: {version.version}</Typography>
              </Box>
              {version.metadata.buildOptions?.uploadType !== ModelUploadType.ModelCard && (
                <Stack spacing={2} direction='row' sx={{ p: 1 }}>
                  <Button
                    variant='contained'
                    href={`/api/v1/deployment/${deployment.uuid}/version/${version.version}/raw/code`}
                    target='_blank'
                    data-test='downloadCodeFile'
                  >
                    Download code file
                  </Button>
                  <Button
                    variant='contained'
                    href={`/api/v1/deployment/${deployment.uuid}/version/${version.version}/raw/binary`}
                    target='_blank'
                    data-test='downloadBinaryFile'
                  >
                    Download binary file
                  </Button>
                </Stack>
              )}
              {version.metadata.buildOptions?.uploadType === ModelUploadType.ModelCard && (
                <Typography sx={{ p: 1 }}>This is a Model Card Only</Typography>
              )}
            </Box>
            <Divider orientation='horizontal' />
          </Box>
        ))}
      {versions && versions.length === 0 && <EmptyBlob text='No exportable versions' />}
    </>
  )
}

export default RawModelExportList
