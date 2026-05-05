import { Delete, Info, MoreVert, Refresh } from '@mui/icons-material'
import { Box, Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip } from '@mui/material'
import { rerunImageArtefactScan, useGetArtefactScannerInfo } from 'actions/artefactScanning'
import { deleteEntryImage } from 'actions/entry'
import { useGetReleasesForModelId } from 'actions/release'
import { useGetUiConfig } from 'actions/uiConfig'
import { useCallback, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import AssociatedReleasesDialog from 'src/entry/model/releases/AssociatedReleasesDialog'
import AssociatedReleasesList from 'src/entry/model/releases/AssociatedReleasesList'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { ArtefactKind, ImageTagResult, ModelImagesWithOptionalScanResults, SeverityLevel } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

const severities = [
  SeverityLevel.CRITICAL,
  SeverityLevel.HIGH,
  SeverityLevel.MEDIUM,
  SeverityLevel.LOW,
  SeverityLevel.UNKNOWN,
]

function sortPlatformByVulnerability(scanResults: ImageTagResult[]): ImageTagResult[] {
  return scanResults.toSorted((a, b) => {
    let res = 0
    for (let i = 0; i < severities.length; i++) {
      if (a.severityCounts[severities[i]] > b.severityCounts[severities[i]]) {
        res = -1
        break
      } else if (a.severityCounts[severities[i]] < b.severityCounts[severities[i]]) {
        res = 1
        break
      }
    }
    return res
  })
}

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
  const [associatedReleasesOpen, setAssociatedReleasesOpen] = useState(false)
  const [deleteImageOpen, setDeleteImageOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')

  const handleImageMoreButtonClose = () => {
    setAnchorElMore(null)
  }

  const { releases } = useGetReleasesForModelId(modelImage.repository)
  const latestRelease = releases.length > 0 ? releases[0].semver : ''

  const associatedReleasesForTag = (tag: string) =>
    releases.filter((release) =>
      release.images.some(
        (image) => image.repository === modelImage.repository && image.name === modelImage.name && image.tag === tag,
      ),
    )

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

  function filterTagResult(tagResult: ImageTagResult, imageTag: string) {
    if (tagResult.platform && tagResult.platform === 'unknown/unknown') {
      return false
    }
    if (tagResult.tag === imageTag) {
      return true
    }
    return false
  }
  const handleDeleteConfirm = useCallback(async () => {
    if (!tag || isDeleting) {
      return
    }
    try {
      setIsDeleting(true)
      setDeleteErrorMessage('')

      const response = await deleteEntryImage(modelImage.repository, modelImage.name, tag)
      if (!response.ok) {
        setDeleteErrorMessage(await getErrorMessage(response))
        return
      }

      sendNotification({
        variant: 'success',
        msg: `Image ${modelImage.name}:${tag} deleted`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })

      setDeleteImageOpen(false)
      handleImageMoreButtonClose()
      mutate()
    } catch (err) {
      setDeleteErrorMessage(`Failed to delete image.\n${err}`)
    } finally {
      setIsDeleting(false)
    }
  }, [tag, isDeleting, modelImage.name, modelImage.repository, mutate, sendNotification])

  const reportDisplay = (imageTag: string) => {
    if (modelImage && modelImage.scanSummaries) {
      const tagResults = modelImage.scanSummaries.filter((tagResult) => filterTagResult(tagResult, imageTag))
      if (tagResults.length === 0) {
        return
      }
      const multiplatform = !!tagResults && !!tagResults[0].platform
      const sortedTagResults = sortPlatformByVulnerability(tagResults)
      return (
        <VulnerabilityResult
          scanResults={sortedTagResults}
          warningOnly
          detailedViewUrlPrefix={`/model/${modelImage.repository}/registry/${encodeURIComponent(modelImage.name)}/${tagResults[0].tag}/`}
          multiplatform={multiplatform}
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
              title={'A single image tag that automatically provides the correct architecture for the host machine'}
            >
              <Chip color='primary' label='Multi-platform' />
            </Tooltip>
          )}
        </Stack>
        <Stack direction='row' spacing={2} alignItems='center'>
          {reportDisplay(tag)}
          <IconButton aria-label='toggle image options menu' onClick={(event) => setAnchorElMore(event.currentTarget)}>
            <MoreVert color='primary' />
          </IconButton>
          <Menu anchorEl={anchorElMore} open={Boolean(anchorElMore)} onClose={() => handleImageMoreButtonClose()}>
            <MenuItem
              onClick={() => {
                handleImageMoreButtonClose()
                setAssociatedReleasesOpen(true)
              }}
            >
              <ListItemIcon>
                <Info color='primary' fontSize='small' />
              </ListItemIcon>
              <ListItemText>Associated releases</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleImageMoreButtonClose()
                setDeleteErrorMessage('')
                setDeleteImageOpen(true)
              }}
            >
              <ListItemIcon>
                <Delete color='primary' fontSize='small' />
              </ListItemIcon>
              <ListItemText>Delete image</ListItemText>
            </MenuItem>
            {scanners &&
              !isScannersError &&
              scanners.some((scanner) => scanner.artefactKind === ArtefactKind.IMAGE) && (
                <MenuItem onClick={() => handleRescan(tag)}>
                  <ListItemIcon>
                    <Refresh color='primary' fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Rerun image scan</ListItemText>
                </MenuItem>
              )}
          </Menu>
          <ConfirmationDialogue
            open={deleteImageOpen}
            title='Delete Image'
            onConfirm={handleDeleteConfirm}
            onCancel={() => {
              if (!isDeleting) {
                setDeleteImageOpen(false)
              }
            }}
            errorMessage={deleteErrorMessage}
            confirmDisabled={isDeleting}
            confirmLoading={isDeleting}
            dialogMessage={
              associatedReleasesForTag(tag).length > 0
                ? 'Deleting this image will affect the following releases:'
                : 'Deleting this image will not affect any existing releases'
            }
          >
            <Box sx={{ pt: 2 }}>
              <AssociatedReleasesList
                modelId={modelImage.repository}
                latestRelease={latestRelease}
                releases={associatedReleasesForTag(tag)}
              />
            </Box>
          </ConfirmationDialogue>
          <AssociatedReleasesDialog
            open={associatedReleasesOpen}
            onClose={() => setAssociatedReleasesOpen(false)}
            modelId={modelImage.repository}
            latestRelease={latestRelease}
            sortedAssociatedReleases={associatedReleasesForTag(tag)}
          />
        </Stack>
      </Stack>
    </Box>
  )
}
