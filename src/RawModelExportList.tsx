import React from 'react'

import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'

import { useGetModelById, useGetModelVersions } from '../data/model'
import { Deployment } from '../types/interfaces'
import EmptyBlob from './common/EmptyBlob'
import Button from '@mui/material/Button'
import axios from 'axios'
import Snackbar from '@mui/material/Snackbar'

const RawModelExportList = ({ deployment }: { deployment: Deployment }) => {
  const { model } = useGetModelById(deployment.model.toString())
  const { versions } = useGetModelVersions(model?.uuid)
  const [openSnackbar, setOpenSnackbar] = React.useState(false)

  const handleClose = (_event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpenSnackbar(false)
  }

  const downloadFile = async (version: string, fileType: string) => {
    await axios({
      method: 'get',
      url: `/api/v1/deployment/${deployment.uuid}/version/${version}/raw/${fileType}`,
      responseType: 'blob',
    })
      .then((res) => {
        if (res.status === 401) {
          setOpenSnackbar(true)
        }
        if (res.status === 200) {
          const url = window.URL.createObjectURL(new Blob([res.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `${fileType}.zip`)
          document.body.appendChild(link)
          link.click()

          // Clean up and remove the link
          link.parentNode && link.parentNode.removeChild(link)
          URL.revokeObjectURL(url)
        }
      })
      .catch((e) => {
        if (e.response.status === 401) {
          setOpenSnackbar(true)
        }
      })
  }

  return (
    <>
      {versions &&
        versions.map((version: any) => {
          if (version.metadata?.buildOptions?.exportRawModel) {
            return (
              <Box key={version.version}>
                <Box sx={{ p: 1 }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant='h4'>Version: {version.version}</Typography>
                  </Box>
                  <Stack spacing={2} direction='row' sx={{ p: 1 }}>
                    <Button variant='contained' onClick={() => downloadFile(version.version, 'code')}>
                      Download code file
                    </Button>
                    <Button variant='contained' onClick={() => downloadFile(version.version, 'binary')}>
                      Download binary file
                    </Button>
                  </Stack>
                </Box>
                <Divider orientation='horizontal' />
              </Box>
            )
          }
        })}
      {versions && versions.filter((e) => e.metadata.buildOptions?.exportRawModel).length === 0 && (
        <EmptyBlob text='No exportable versions' />
      )}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleClose}
        message='User not authorised to download file'
      />
    </>
  )
}

export default RawModelExportList
