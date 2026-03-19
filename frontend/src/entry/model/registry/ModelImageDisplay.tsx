import { ExpandLess, ExpandMore, MoreVert, Refresh } from '@mui/icons-material'
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
import { rerunImageArtefactScan } from 'actions/artefactScanning'
import { useGetUiConfig } from 'actions/uiConfig'
import { useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { ModelImagesWithOptionalScanResults } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type ModelImageDisplayProps = {
  modelImage: ModelImagesWithOptionalScanResults
  mutate: () => void
}

export default function ModelImageDisplay({ modelImage, mutate }: ModelImageDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const [anchorElMore, setAnchorElMore] = useState<HTMLElement | null>(null)

  const sendNotification = useNotification()

  function toggleExpand() {
    setExpanded(!expanded)
  }

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
          <Link target='_blank' href={`/model/${modelImage.repository}/registry/${modelImage.name}/${tag}`}>
            <Typography textOverflow='ellipsis' overflow='hidden'>
              {tag}
            </Typography>
          </Link>
          <Box width='fit-content'>
            <CodeLine
              line={`docker pull ${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelImage.repository}/${modelImage.name}:${tag}`}
            />
          </Box>
        </Stack>
        <Stack direction='row' spacing={2} alignItems='center'>
          {reportDisplay(tag)}
          <IconButton aria-label='toggle image options menu' onClick={(event) => setAnchorElMore(event.currentTarget)}>
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

  const modelImageTagRow = ({ data }) => modelImageTag(data.tag)

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading) {
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
