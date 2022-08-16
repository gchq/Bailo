import React from 'react'

import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import CopyIcon from '@mui/icons-material/ContentCopyTwoTone'
import Tooltip from '@mui/material/Tooltip'

import { useGetModelById, useGetModelVersions } from '../data/model'
import { Deployment } from '../types/interfaces'
import CopiedSnackbar from './common/CopiedSnackbar'
import EmptyBlob from './common/EmptyBlob'

const DeploymentVersion = ({ text, type }: { text: string; type: string }) => {
  const [openSnackbar, setOpenSnackbar] = React.useState(false)

  const handleButtonClick = () => {
    navigator.clipboard.writeText(text)
    setOpenSnackbar(true)
  }

  return (
    <Stack spacing={2} direction='row' sx={{ p: 1 }}>
      <TextField
        sx={{ width: 500 }}
        label={type + ' path'}
        defaultValue={text}
        inputProps={{ readOnly: true }}
        variant='filled'
      >
        {text}
      </TextField>
      <Tooltip title='Copy' arrow placement='bottom'>
        <IconButton aria-label='delete' onClick={handleButtonClick}>
          <CopyIcon />
        </IconButton>
      </Tooltip>
      <CopiedSnackbar {...{ openSnackbar, setOpenSnackbar }} />
    </Stack>
  )
}

const RawModelExportList = ({ deployment }: { deployment: Deployment }) => {
  const { model } = useGetModelById(deployment.model.toString())
  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(model?.uuid)

  return (
    <>
      {versions &&
        versions.map((version: any) => {
          if (version.metadata?.buildOptions?.exportRawModel) {
            return (
              <>
                <Box sx={{ p: 1 }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant='h4'>Version: {version.version}</Typography>
                  </Box>
                  <DeploymentVersion text={version.rawCodePath} type='code' />
                  <DeploymentVersion text={version.rawBinaryPath} type='binary' />
                </Box>
                <Divider orientation='horizontal' />
              </>
            )
          }
        })}
      {versions && versions.filter((e) => e.metadata.buildOptions?.exportRawModel).length === 0 && (
        <EmptyBlob text='No exportable versions' />
      )}
    </>
  )
}

export default RawModelExportList
