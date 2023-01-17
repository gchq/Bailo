import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import Button from '@mui/material/Button'
import { useState } from 'react'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Dialog from '@mui/material/Dialog'
import { Divider } from '@mui/material'
import DirectoryTreeView from './DirectoryTreeView'
import { ModelUploadType } from '../types/interfaces'
import DisabledElementTooltip from './common/DisabledElementTooltip'

function RawModelExportItem({
  deploymentUuid,
  version,
  uploadType,
}: {
  deploymentUuid: string
  version: string
  uploadType?: ModelUploadType
}) {
  const [displayTree, setDisplayTree] = useState(false)

  let primaryButtonDisabledReason = 'No files to download'
  if (uploadType === ModelUploadType.Zip || uploadType === undefined) {
    primaryButtonDisabledReason = ''
  }

  const hideTree = () => {
    setDisplayTree(false)
  }

  return (
    <>
      <Box sx={{ p: 1 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant='h4'>Version: {version}</Typography>
        </Box>
        <Stack spacing={2} direction='row' sx={{ p: 1 }}>
          <DisabledElementTooltip conditions={[primaryButtonDisabledReason]}>
            <Button
              variant='contained'
              href={`/api/v1/deployment/${deploymentUuid}/version/${version}/raw/code`}
              target='_blank'
              data-test='downloadCodeFile'
              disabled={!!primaryButtonDisabledReason}
            >
              Download code files
            </Button>
          </DisabledElementTooltip>
          <DisabledElementTooltip conditions={[primaryButtonDisabledReason]}>
            <Button
              variant='contained'
              href={`/api/v1/deployment/${deploymentUuid}/version/${version}/raw/binary`}
              target='_blank'
              data-test='downloadBinaryFile'
              disabled={!!primaryButtonDisabledReason}
            >
              Download binary file
            </Button>
          </DisabledElementTooltip>
          <Divider flexItem orientation='vertical' />
          <DisabledElementTooltip conditions={[primaryButtonDisabledReason]}>
            <Button variant='outlined' disabled={!!primaryButtonDisabledReason} onClick={() => setDisplayTree(true)}>
              Display files
            </Button>
          </DisabledElementTooltip>
        </Stack>
      </Box>
      <Dialog open={displayTree} onClose={hideTree}>
        <DialogTitle>Showing files for {deploymentUuid}</DialogTitle>
        <DialogContent sx={{ overflowX: 'auto', py: 2 }}>
          <DirectoryTreeView uuid={deploymentUuid} version={version} displayTree={displayTree} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RawModelExportItem
