import { Done, Error, Warning } from '@mui/icons-material'
import { Chip, Divider, Grid, Link, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { useGetFileScannerInfo } from 'actions/fileScanning'
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

  const { scanners, isScannersLoading, isScannersError } = useGetFileScannerInfo()

  const open = Boolean(anchorEl)

  const avChip = useMemo(() => {
    if (
      !isFileInterface(file) ||
      file.avScan === undefined ||
      file.avScan.every((scan) => scan.state === ScanState.NotScanned)
    ) {
      return <Chip size='small' label='Virus scan results could not be found' />
    }
    const threatsFound = file.avScan.reduce((acc, scan) => {
      return scan.viruses ? scan.viruses.length + acc : acc
    }, 0)
    if (file.avScan.some((scan) => scan.state !== ScanState.Complete)) {
      return <Chip size='small' label='Virus scan in progress' />
    }
    return (
      <>
        <Chip
          color={threatsFound ? 'error' : 'success'}
          icon={threatsFound ? <Warning /> : <Done />}
          size='small'
          onClick={(e) => setAnchorEl(e.currentTarget)}
          label={threatsFound ? `Virus scan failed: ${plural(threatsFound, 'threat')} found` : 'Virus scan passed'}
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
  }, [anchorEl, file, open])

  if (isScannersError) {
    return <MessageAlert message={isScannersError.info.message} severity='error' />
  }

  if (isScannersLoading) {
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
              {scanners && avChip}
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
