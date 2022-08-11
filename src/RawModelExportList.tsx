import React from 'react'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import VisibilityIcon from '@mui/icons-material/VisibilityTwoTone'

import { useGetModelById, useGetModelVersions } from '../data/model'
import { Deployment } from '../types/interfaces'

const DeploymentVersion = ({ text, type }: { text: string; type: string }) => {
  const [displayText, setDisplayText] = React.useState<boolean>(false)

  const toggleText = () => {
    setDisplayText(!displayText)
  }

  return (
    <Stack direction='row'>
      <Button sx={{ m: 1 }} variant='text' onClick={toggleText} startIcon={<VisibilityIcon />}>
        {displayText ? 'Hide' : 'Show'} {type} path
      </Button>
      <Box component={Stack} direction='column' justifyContent='center'>
        <Typography variant='body1'>{displayText ? text : 'xxxxxxxx/xxxxxxxx/xxxxxxxx'}</Typography>
      </Box>
    </Stack>
  )
}

const RawModelExportList = ({ deployment }: { deployment: Deployment }) => {
  const { model } = useGetModelById(deployment.model.toString())
  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(model?.uuid)

  return (
    <>
      {!isVersionsLoading &&
        !isVersionsError &&
        versions?.map((version: any) => {
          if (version?.buildOptions?.rawModelExport) {
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
    </>
  )
}

export default RawModelExportList
