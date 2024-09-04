import { Coronavirus } from '@mui/icons-material'
import { Box, Button, Grid, Link, Popover, Stack, Tooltip, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { useState } from 'react'
import { FileInterface, isFileInterface, ScanState } from 'types/types'

type FileDownloadProps = {
  modelId: string
  file: FileInterface | File
}

export default function FileDownload({ modelId, file }: FileDownloadProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const stateDisplay = (state: string) => {
    const result = state.replace(/([A-Z])/g, ' $1')
    return result.charAt(0).toUpperCase() + result.slice(1)
  }

  return (
    <>
      {isFileInterface(file) && (
        <>
          <Grid container alignItems='center' key={file.name}>
            <Grid item xs={11}>
              <Stack direction='row' alignItems='center' spacing={2}>
                <Tooltip title={file.name}>
                  <Link href={`/api/v2/model/${modelId}/file/${file._id}/download`} data-test={`fileLink-${file.name}`}>
                    <Typography noWrap textOverflow='ellipsis'>
                      {file.name}
                    </Typography>
                  </Link>
                </Tooltip>
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<Coronavirus />}
                  onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
                >
                  AV Results
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={1} textAlign='right'>
              <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
            </Grid>
          </Grid>
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <Box sx={{ p: 1 }}>
              <Stack>
                <Typography>Scan status: {stateDisplay(file.avScan.state)}</Typography>
                {file.avScan.state === ScanState.Complete && (
                  <Typography fontWeight='bold'>{file.avScan.isInfected ? 'Infected' : 'Not infected'}</Typography>
                )}
                {file.avScan.state === ScanState.Complete && file.avScan.viruses && file.avScan.isInfected && (
                  <Typography>Viruses found: {file.avScan.viruses.length}</Typography>
                )}
              </Stack>
            </Box>
          </Popover>
        </>
      )}
    </>
  )
}
