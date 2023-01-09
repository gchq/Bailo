import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import Button from '@mui/material/Button'

import { useState } from 'react'
import { useRouter } from 'next/router'
import DirectoryTreeView from './common/DirectoryTreeView'
import SplitButton, { menuItemData } from './common/SplitButton'
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
  const router = useRouter()
  const [displayTree, setDisplayTree] = useState(false)

  let defaultMenuItems: [{ label: string; disabledReason: string | undefined }]
  let primaryButtonDisabledReason: string | undefined = 'No files to download'
  if (uploadType === ModelUploadType.Zip || uploadType === undefined) {
    defaultMenuItems = [menuItemData('Show Code File Tree', undefined)]
    primaryButtonDisabledReason = undefined
  } else {
    defaultMenuItems = [menuItemData('No Code File Tree', `No files to show`)]
  }
  const [codeMenuItems, setCodeMenuItems] = useState(defaultMenuItems)

  const handleCodeMenuItemClicked = (item: string) => {
    if (item === 'Show Code File Tree') {
      setDisplayTree(true)
      setCodeMenuItems([menuItemData('Hide Code File Tree', undefined)])
    }
    if (item === 'Hide Code File Tree') {
      setDisplayTree(true)
      setCodeMenuItems([menuItemData('Show Code File Tree', undefined)])
    }
  }

  const handleCodeButtonClicked = () => {
    router.push(`/api/v1/deployment/${deploymentUuid}/version/${version}/raw/code`)
  }

  return (
    <Box key={version}>
      <Box sx={{ p: 1 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant='h4'>Version: {version}</Typography>
        </Box>
        <Stack spacing={2} direction='row' sx={{ p: 1 }}>
          <SplitButton
            title='Download code file'
            primaryDisabled={primaryButtonDisabledReason}
            options={codeMenuItems}
            onButtonClick={() => {
              handleCodeButtonClicked()
            }}
            onMenuItemClick={handleCodeMenuItemClicked}
          />
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
        </Stack>
        <DirectoryTreeView
          uuid={`${deploymentUuid}`}
          version={`${version}`}
          fileType='code'
          displayTree={displayTree}
        />
      </Box>
      <Divider orientation='horizontal' />
    </Box>
  )
}

export default RawModelExportItem
