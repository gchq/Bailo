import { ExpandLess, ExpandMore, LocalOffer } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { rerunImageArtefactScan } from 'actions/artefactScanning'
import { useCallback, useState } from 'react'
import Paginate from 'src/common/Paginate'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import { ImageScanDetail, ModelImageWithScans } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type ModelImageDisplayProps = {
  modelImage: ModelImageWithScans
  mutate: () => void
}

export default function ModelImageDisplay({ modelImage, mutate }: ModelImageDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  const sendNotification = useNotification()

  function toggleExpand() {
    setExpanded(!expanded)
  }

  const getScanResultCounts = (imageTag: string) => {
    const tagResults = modelImage.scanResults.find((tagResult) => tagResult.tag === imageTag)
    if (tagResults) {
      const combined = tagResults.results.reduce(
        (a, obj) =>
          Object.entries(obj.imageScanDetail !== ImageScanDetail.NONE && obj.severityCounts).reduce((a, [key, val]) => {
            a[key] = (a[key] || 0) + val
            return a
          }, a),
        {},
      )
      return combined
    }
  }

  const handleRescan = useCallback(
    async (tag: string) => {
      const response = await rerunImageArtefactScan(modelImage.repository, modelImage.name, tag)
      if (response.status === 200) {
        sendNotification({
          variant: 'success',
          msg: `Starting manual re-scan of ${name}:${tag}`,
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

  const modelImageTag = ({ data }) => (
    <Box width='100%' key={`${modelImage.repository}-${modelImage.name}-${data.tag}`}>
      <Grid container alignItems='center' spacing={2}>
        <Grid size={1}>
          <Stack direction='row' alignItems='center' justifyContent='left' spacing={2}>
            <LocalOffer color='primary' />
            <Typography color='primary'>{data.tag}</Typography>
          </Stack>
        </Grid>
        <Grid size='auto'>
          <Stack direction={{ sm: 'column', md: 'row' }} alignItems='center' justifyContent='left' spacing={2}>
            <Typography fontWeight='bold'>Vulnerabilities: </Typography>
            <VulnerabilityResult {...getScanResultCounts(data.tag)} onRescan={() => handleRescan(data.tag)} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )

  return (
    <>
      <Card
        sx={{
          width: '100%',
          p: 2,
        }}
      >
        <Stack direction='column' spacing={1}>
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
                  {modelImageTag}
                </Paginate>
              </AccordionDetails>
            </Accordion>
          ) : (
            modelImage.tags.map((imageTag) => (
              <Box width='100%' key={`${modelImage.repository}-${modelImage.name}-${imageTag}`}>
                <Stack spacing={2} direction='row' divider={<Divider flexItem orientation='vertical' />}>
                  <Stack direction='row' alignItems='center' justifyContent='left' spacing={2}>
                    <LocalOffer color='primary' />
                    <Link href={`/model/${modelImage.repository}/registry/${modelImage.name}/${imageTag}`}>
                      <Button size='large' color='primary'>
                        {imageTag}
                      </Button>
                    </Link>
                  </Stack>
                  <VulnerabilityResult {...getScanResultCounts(imageTag)} onRescan={() => handleRescan(imageTag)} />
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </Card>
    </>
  )
}
