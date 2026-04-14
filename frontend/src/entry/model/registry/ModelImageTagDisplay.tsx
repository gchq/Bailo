import { MoreVert, Refresh } from '@mui/icons-material'
import { Box, Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from '@mui/material'
import { rerunImageArtefactScan, useGetArtefactScannerInfo } from 'actions/artefactScanning'
import { useGetUiConfig } from 'actions/uiConfig'
import { useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { ArtefactKind, ModelImagesWithOptionalScanResults } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface ModelImageTagDisplayProps {
  modelImage: ModelImagesWithOptionalScanResults
  tag: string
  mutate: () => void
}

export default function ModelImageTagDisplay({ modelImage, tag, mutate }: ModelImageTagDisplayProps) {
  const sendNotification = useNotification()
  const { scanners, isScannersLoading, isScannersError } = useGetArtefactScannerInfo()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const [anchorElMore, setAnchorElMore] = useState<HTMLElement | null>(null)

  const handleRescan = useCallback(
    async (tag: string) => {
      const response = await rerunImageArtefactScan(modelImage.repository, modelImage.name, tag)
      if (response.status === 200) {
        sendNotification({
          variant: 'success',
          msg: `${modelImage.name}:${tag} is being rescanned`,
          anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
        })
        mutate()
      } else {
        sendNotification({
          variant: 'error',
          msg: await getErrorMessage(response),
          anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
        })
      }
    },
    [modelImage.name, modelImage.repository, mutate, sendNotification],
  )

  const reportDisplay = (imageTag: string) => {
    if (modelImage && modelImage.scanSummaries) {
      const tagResult = modelImage.scanSummaries.filter((tagResult) => tagResult.tag === imageTag)
      return (
        <VulnerabilityResult
          results={tagResult}
          warningOnly
          detailedViewUrl={`/model/${modelImage.repository}/registry/${modelImage.name}/${imageTag}`}
        />
      )
    }
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isScannersError) {
    return <MessageAlert message={isScannersError.info.message} severity='error' />
  }
  if (isUiConfigLoading || isScannersLoading) {
    return <Loading />
  }

  return (
    <Box width='100%' key={`${modelImage.repository}-${modelImage.name}-${tag}`} sx={{ py: 0.5 }}>
      <Stack direction={{ sm: 'column', md: 'row' }} justifyContent='space-between' alignItems='center' spacing={2}>
        <Stack spacing={2} direction='row' alignItems='center'>
          <Box width='fit-content'>
            <CodeLine
              line={`docker pull ${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelImage.repository}/${modelImage.name}:${tag}`}
            />
          </Box>
          {modelImage.scanSummaries[0].platform && <Chip color='primary' label='Multi-platform' />}
        </Stack>
        {scanners && scanners.some((scanner) => scanner.artefactKind === ArtefactKind.IMAGE) && (
          <Stack direction='row' spacing={2} alignItems='center'>
            {reportDisplay(tag)}
            <IconButton
              aria-label='toggle image options menu'
              onClick={(event) => setAnchorElMore(event.currentTarget)}
            >
              <MoreVert color='primary' />
            </IconButton>
            <Menu anchorEl={anchorElMore} open={Boolean(anchorElMore)} onClose={() => setAnchorElMore(null)}>
              <MenuItem onClick={() => handleRescan(tag)}>
                <ListItemIcon>
                  <Refresh color='primary' fontSize='small' />
                </ListItemIcon>
                <ListItemText>Rerun image scan</ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
