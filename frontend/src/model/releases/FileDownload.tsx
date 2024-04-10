import { Grid, Link, Tooltip, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { FileInterface, isFileInterface } from 'types/types'

type FileDownloadProps = {
  modelId: string
  file: FileInterface
}

export default function FileDownload({ modelId, file }: FileDownloadProps) {
  return (
    <>
      {isFileInterface(file) && (
        <Grid container alignItems='center' key={file.name}>
          <Grid item xs={11}>
            {isFileInterface(file) && (
              <Tooltip title={file.name}>
                <Link href={`/api/v2/model/${modelId}/file/${file._id}/download`} data-test={`fileLink-${file.name}`}>
                  <Typography noWrap textOverflow='ellipsis'>
                    {file.name}
                  </Typography>
                </Link>
              </Tooltip>
            )}
          </Grid>
          <Grid item xs={1} textAlign='right'>
            <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
          </Grid>
        </Grid>
      )}
    </>
  )
}
