import { Done, Error, Warning } from '@mui/icons-material'
import { Chip, Divider, Grid, Link, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import prettyBytes from 'pretty-bytes'
import { Fragment, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface, ScanState } from 'types/types'
import { plural } from 'utils/stringUtils'

type FileDownloadProps = {
  modelId: string
  file: FileInterface | File
}

export default function FileDownload({ modelId, file }: FileDownloadProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const open = Boolean(anchorEl)

  const avChip = useMemo(() => {
    if (
      !isFileInterface(file) ||
      file.avScan === undefined ||
      file.avScan.every((scan) => scan.state === ScanState.NotScanned)
    ) {
      return <Chip size='small' label='Virus scan results could not be found' />
    }
    const allTestsPassed = file.avScan.every((scan) => !scan.isInfected)
    const threatsFound = file.avScan.reduce((acc, scan) => {
      return scan.viruses ? scan.viruses.length + acc : acc
    }, 0)
    if (file.avScan.some((scan) => scan.state !== ScanState.Complete)) {
      return <Chip size='small' label='Virus scan in progress' />
    }
    if (threatsFound) {
      return (
        <>
          <Chip
            color={'error'}
            icon={<Warning />}
            size='small'
            onClick={(e) => setAnchorEl(e.currentTarget)}
            label={`Virus scan failed: ${plural(threatsFound, 'threat')} found`}
          />
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
            <Stack spacing={2} sx={{ p: 2 }} divider={<Divider flexItem />}>
              {file.avScan.map((scanResult) => (
                <Fragment key={scanResult.toolName}>
                  {scanResult.isInfected ? (
                    <>
                      <Stack spacing={1} direction='row'>
                        <Error color='error' />
                        <Typography>
                          <span style={{ fontWeight: 'bold' }}>{scanResult.toolName}</span> found the following threats:
                        </Typography>
                      </Stack>
                      <ul>{scanResult.viruses && scanResult.viruses.map((virus) => <li key={virus}>{virus}</li>)}</ul>
                    </>
                  ) : (
                    <Stack spacing={1} direction='row'>
                      <Done color='success' />
                      <Typography>
                        <span style={{ fontWeight: 'bold' }}>{scanResult.toolName}</span> did not find any threats
                      </Typography>
                    </Stack>
                  )}
                </Fragment>
              ))}
            </Stack>
          </Popover>
        </>
      )
    }
    if (allTestsPassed) {
      return <Chip color={'success'} icon={<Done />} size='small' label={'Virus scan passed'} />
    }
  }, [anchorEl, file, open])

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading) {
    return <Loading />
  }

  return (
    <>
      {isFileInterface(file) && (
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
              {uiConfig && uiConfig.avScanning && avChip}
            </Stack>
          </Grid>
          <Grid item xs={1} textAlign='right'>
            <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
          </Grid>
        </Grid>
      )}
    </>
  )
}
