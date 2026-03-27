import { Delete, ExpandLess, ExpandMore, Info, MoreVert, Refresh } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { rerunImageArtefactScan, useGetArtefactScannerInfo } from 'actions/artefactScanning'
import { deleteEntryImage } from 'actions/entry'
import { useGetReleasesForModelId } from 'actions/release'
import { useGetUiConfig } from 'actions/uiConfig'
import { useCallback, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import AssociatedImageReleasesDialog from 'src/entry/model/releases/AssociatedImageReleasesDialog'
import AssociatedImageReleasesList from 'src/entry/model/releases/AssociatedImageReleasesList'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { ArtefactKind, ModelImagesWithOptionalScanResults } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type ModelImageDisplayProps = {
  modelImage: ModelImagesWithOptionalScanResults
  mutate: () => void
}

export default function ModelImageDisplay({ modelImage, mutate }: ModelImageDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { scanners, isScannersLoading, isScannersError } = useGetArtefactScannerInfo()
  const [anchorElMore, setAnchorElMore] = useState<HTMLElement | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [associatedReleasesOpen, setAssociatedReleasesOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')

  const sendNotification = useNotification()

  function toggleExpand() {
    setExpanded(!expanded)
  }

  const { releases } = useGetReleasesForModelId(modelImage.repository)
  const latestRelease = releases.length > 0 ? releases[0].semver : ''

  const associatedReleasesForTag = (tag: string) =>
    releases.filter((release) =>
      release.images.some(
        (image) => image.repository === modelImage.repository && image.name === modelImage.name && image.tag === tag,
      ),
    )

  const reportDisplay = (imageTag: string) => {
    if (modelImage && modelImage.scanSummaries) {
      const tagResults = modelImage.scanSummaries.find((tagResult) => tagResult.tag === imageTag)

      return (
        <VulnerabilityResult
          results={tagResults}
          warningOnly
          detailedViewUrl={`/model/${modelImage.repository}/registry/${modelImage.name}/${imageTag}`}
        />
      )
    }
  }

  const modelImageTag = (tag: string) => (
    <Box width='100%' key={`${modelImage.repository}-${modelImage.name}-${tag}`} sx={{ py: 0.5 }}>
      <Stack direction={{ sm: 'column', md: 'row' }} justifyContent='space-between' alignItems='center' spacing={2}>
        <Stack spacing={2} direction='row' divider={<Divider flexItem orientation='vertical' />} alignItems='center'>
          <Box width='fit-content'>
            <CodeLine
              line={`docker pull ${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelImage.repository}/${modelImage.name}:${tag}`}
            />
          </Box>
        </Stack>
        {scanners && scanners.some((scanner) => scanner.artefactKind === ArtefactKind.IMAGE) && (
          <Stack direction='row' spacing={2} alignItems='center'>
            {reportDisplay(tag)}
            <IconButton
              aria-label='toggle image options menu'
              onClick={(event) => {
                setAnchorElMore(event.currentTarget)
                setActiveTag(tag)
              }}
            >
              <MoreVert color='primary' />
            </IconButton>
            <Menu anchorEl={anchorElMore} open={Boolean(anchorElMore)} onClose={() => setAnchorElMore(null)}>
              <MenuItem
                onClick={() => {
                  setAnchorElMore(null)
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
                  setAnchorElMore(null)
                  setDeleteOpen(true)
                }}
              >
                <ListItemIcon>
                  <Delete color='primary' fontSize='small' />
                </ListItemIcon>
                <ListItemText>Delete image</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleRescan(tag)}>
                <ListItemIcon>
                  <Refresh color='primary' fontSize='small' />
                </ListItemIcon>
                <ListItemText>Rerun image scan</ListItemText>
              </MenuItem>
            </Menu>
            <ConfirmationDialogue
              open={deleteOpen}
              title='Delete Image'
              onConfirm={handleDeleteConfirm}
              onCancel={() => setDeleteOpen(false)}
              errorMessage={deleteErrorMessage}
              dialogMessage={
                associatedReleasesForTag(activeTag ?? '').length > 0
                  ? 'Deleting this image will affect the following releases:'
                  : 'Deleting this image will not affect any existing releases'
              }
            >
              <Box sx={{ pt: 2 }}>
                <AssociatedImageReleasesList
                  modelId={modelImage.repository}
                  latestRelease={latestRelease}
                  releases={associatedReleasesForTag(activeTag ?? '')}
                />
              </Box>
            </ConfirmationDialogue>
            <AssociatedImageReleasesDialog
              open={associatedReleasesOpen}
              onClose={() => setAssociatedReleasesOpen(false)}
              modelId={modelImage.repository}
              latestRelease={latestRelease}
              releases={associatedReleasesForTag(activeTag ?? '')}
            />
          </Stack>
        )}
      </Stack>
    </Box>
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

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeTag) {
      return
    }
    const response = await deleteEntryImage(modelImage.repository, modelImage.name, activeTag)
    if (!response.ok) {
      setDeleteErrorMessage(await getErrorMessage(response))
      return
    }
    sendNotification({
      variant: 'success',
      msg: `Image ${modelImage.name}:${activeTag} deleted`,
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
    })
    setDeleteOpen(false)
    mutate()
  }, [activeTag, modelImage.name, modelImage.repository, mutate, sendNotification])

  const modelImageTagRow = ({ data }) => modelImageTag(data.tag)

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
    <>
      <Card
        sx={{
          width: '100%',
          p: 2,
          border: 'none',
        }}
      >
        <Stack direction='column'>
          <Typography
            component='h2'
            variant='h6'
            color='primary'
            sx={{
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}
          >
            {modelImage.name}
          </Typography>
          {modelImage.tags.length >= 10 ? (
            <Accordion expanded={expanded} onChange={toggleExpand}>
              <AccordionSummary expandIcon={expanded ? <ExpandLess /> : <ExpandMore />} sx={{ px: 0 }}>
                <Typography fontWeight='bold'>
                  {expanded ? 'Hide' : 'Show'} {modelImage.tags.length} images
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paginate
                  list={modelImage.tags.map((tag) => {
                    return { key: tag, ...{ tag } }
                  })}
                  sortingProperties={[{ value: 'tag', title: 'Tag', iconKind: 'text' }]}
                  searchFilterProperty='tag'
                  searchPlaceholderText='Search by tag'
                  defaultSortProperty='tag'
                  emptyListText={`No image tags found for image ${modelImage.name}`}
                  hideBorders
                  hideDividers
                >
                  {modelImageTagRow}
                </Paginate>
              </AccordionDetails>
            </Accordion>
          ) : (
            modelImage.tags.map((imageTag) => modelImageTag(imageTag))
          )}
        </Stack>
      </Card>
    </>
  )
}
