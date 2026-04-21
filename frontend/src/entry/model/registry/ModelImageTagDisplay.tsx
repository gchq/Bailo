import { MoreVert, Refresh } from '@mui/icons-material'
import { Box, Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip } from '@mui/material'
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

function checkIfMultiPlatform(modelImage: ModelImagesWithOptionalScanResults, tag: string) {
  const correctTag = modelImage.scanSummaries.find((scan) => scan.tag === tag)
  if (correctTag) {
    return !!correctTag.platform
  }
  return false
}

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
      const tagResults = modelImage.scanSummaries.filter((tagResult) => tagResult.tag === imageTag)
      if (tagResults.length === 0) {
        return
      }
      const platforms =
        tagResults && tagResults[0].platform
          ? tagResults.map((result) => result.platform).filter((platform) => platform && platform !== 'unknown/unknown')
          : undefined
      return (
        <VulnerabilityResult
          scanResults={tagResults}
          platforms={platforms}
          warningOnly
          detailedViewUrlPrefix={`/model/${modelImage.repository}/registry/${encodeURIComponent(modelImage.name)}/${tagResults[0].tag}/`}
        />
      )
    }
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
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
          {checkIfMultiPlatform(modelImage, tag) && (
            <Tooltip
              title={
                'A multi-platform image is a single registry entry (image:tag) that contains multiple copies of the same image, but for different OS and architecture combinations. e.g. linux/amd64, windows/amd64, linux/arm64, etc.'
              }
            >
              <Chip color='primary' label='Multi-platform' />
            </Tooltip>
          )}
        </Stack>
        {scanners && !isScannersError && scanners.some((scanner) => scanner.artefactKind === ArtefactKind.IMAGE) && (
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
