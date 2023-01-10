import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import Button from '@mui/material/Button'
import { useState } from 'react'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Dialog from '@mui/material/Dialog'
import { Divider } from '@mui/material'
import DirectoryTreeView from './common/DirectoryTreeView'
import { ModelUploadType } from '../types/interfaces'
import DisabledElementTooltip from './common/DisabledElementTooltip'

function RawModelExportItem({
  deploymentUuid,
  version,
  uploadType,
}: {
  deploymentUuid: string
  version: string
  uploadType: string
}) {
  const [displayTree, setDisplayTree] = useState(false)

  let primaryButtonDisabledReason: string | undefined = 'No files to download'
  if (uploadType === ModelUploadType.Zip || uploadType === undefined) {
    primaryButtonDisabledReason = undefined
  }

  const hideTree = () => {
    setDisplayTree(false)
  }

  return (
    <Box key={version}>
      <Box sx={{ p: 1 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant='h4'>Version: {version}</Typography>
        </Box>
        <Stack spacing={2} direction='row' sx={{ p: 1 }}>
          <DisabledElementTooltip
            conditions={[primaryButtonDisabledReason === undefined ? '' : primaryButtonDisabledReason]}
          >
            <Button
              variant='contained'
              href={`/api/v1/deployment/${deploymentUuid}/version/${version}/raw/code`}
              target='_blank'
              data-test='downloadCodeFile'
              disabled={!(primaryButtonDisabledReason === undefined)}
            >
              Download code files
            </Button>
          </DisabledElementTooltip>
          <DisabledElementTooltip
            conditions={[primaryButtonDisabledReason === undefined ? '' : primaryButtonDisabledReason]}
          >
            <Button
              variant='contained'
              href={`/api/v1/deployment/${deploymentUuid}/version/${version}/raw/binary`}
              target='_blank'
              data-test='downloadBinaryFile'
              disabled={!(primaryButtonDisabledReason === undefined)}
            >
              Download binary file
            </Button>
          </DisabledElementTooltip>
          <Divider flexItem orientation='vertical' />
          <DisabledElementTooltip
            conditions={[primaryButtonDisabledReason === undefined ? '' : primaryButtonDisabledReason]}
          >
            <Button
              variant='outlined'
              disabled={!(primaryButtonDisabledReason === undefined)}
              onClick={() => setDisplayTree(true)}
            >
              Display files
            </Button>
          </DisabledElementTooltip>
        </Stack>
      </Box>
      <Dialog open={displayTree} onClose={hideTree}>
        <DialogTitle>Showing files for {deploymentUuid}</DialogTitle>
        <DialogContent sx={{ maxHeight: '500px', overflowX: 'auto', py: 2 }}>
          <DirectoryTreeView
            uuid={`${deploymentUuid}`}
            version={`${version}`}
            fileType='code'
            displayTree={displayTree}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default RawModelExportItem
