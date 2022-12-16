import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import Button from '@mui/material/Button'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useGetModelById, useGetModelVersions } from '../data/model'
import { Deployment } from '../types/interfaces'
import { ModelDoc } from '../server/models/Model'
import EmptyBlob from './common/EmptyBlob'
import DirectoryTreeView from './common/DirectoryTreeView'
import SplitButton from './common/SplitButton'

function RawModelExportList({ deployment }: { deployment: Deployment }) {
  const router = useRouter()
  const modelFromDeployment: ModelDoc = deployment.model as ModelDoc
  const { model } = useGetModelById(modelFromDeployment._id.toString())
  const { versions } = useGetModelVersions(model?.uuid)
  const [displayTree, setDisplayTree] = useState<boolean>(false)
  const [codeMenuItems, setCodeMenuItems] = useState<string[]>(['Show Code File Tree'])

  const handleCodeMenuItemClicked = (item: string) => {
    if (item === 'Show Code File Tree') {
      setDisplayTree(!displayTree)
      setCodeMenuItems(['Hide Code File Tree'])
    }
    if (item === 'Hide Code File Tree') {
      setDisplayTree(!displayTree)
      setCodeMenuItems(['Show Code File Tree'])
    }
  }

  const handleCodeButtonClicked = (version: string) => {
    router.push(`/api/v1/deployment/${deployment.uuid}/version/${version}/raw/code`)
  }

  return (
    <>
      {versions &&
        versions.map((version: any) => (
          <Box key={version.version}>
            <Box sx={{ p: 1 }}>
              <Box sx={{ p: 2 }}>
                <Typography variant='h4'>Version: {version.version}</Typography>
              </Box>
              <Stack spacing={2} direction='row' sx={{ p: 1 }}>
                <Button
                  variant='contained'
                  href={`/api/v1/deployment/${deployment.uuid}/version/${version.version}/raw/code`}
                  target='_blank'
                  data-test='downloadCodeFile'
                >
                  Download code file
                </Button>
                <SplitButton
                  title='Download code file'
                  options={codeMenuItems}
                  onButtonClick={() => {
                    handleCodeButtonClicked(`${version.version}`)
                  }}
                  onMenuItemClick={handleCodeMenuItemClicked}
                />
                <Button
                  variant='contained'
                  href={`/api/v1/deployment/${deployment.uuid}/version/${version.version}/raw/binary`}
                  target='_blank'
                  data-test='downloadBinaryFile'
                >
                  Download binary file
                </Button>
              </Stack>
              <DirectoryTreeView
                uuid={`${deployment.uuid}`}
                version={`${version.version}`}
                fileType='code'
                displayTree={displayTree}
              />
            </Box>
            <Divider orientation='horizontal' />
          </Box>
        ))}
      {versions && versions.length === 0 && <EmptyBlob text='No exportable versions' />}
    </>
  )
}

export default RawModelExportList
