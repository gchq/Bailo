import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import Button from '@mui/material/Button'

import { useState } from 'react'
import { useRouter } from 'next/router'
import DirectoryTreeView from './common/DirectoryTreeView'
import SplitButton from './common/SplitButton'

function RawModelExportItem({ deploymentUuid, version }: { deploymentUuid: string; version: string }) {
  const router = useRouter()
  const [displayTree, setDisplayTree] = useState(false)
  const [codeMenuItems, setCodeMenuItems] = useState(['Show Code File Tree'])

  const handleCodeMenuItemClicked = (item: string) => {
    if (item === 'Show Code File Tree') {
      setDisplayTree(true)
      setCodeMenuItems(['Hide Code File Tree'])
    }
    if (item === 'Hide Code File Tree') {
      setDisplayTree(true)
      setCodeMenuItems(['Show Code File Tree'])
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
            options={codeMenuItems}
            onButtonClick={() => {
              handleCodeButtonClicked()
            }}
            onMenuItemClick={handleCodeMenuItemClicked}
          />
          <Button
            variant='contained'
            href={`/api/v1/deployment/${deploymentUuid}/version/${version}/raw/binary`}
            target='_blank'
            data-test='downloadBinaryFile'
          >
            Download binary file
          </Button>
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
