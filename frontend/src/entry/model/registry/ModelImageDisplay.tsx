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
import { useState } from 'react'
import Paginate from 'src/common/Paginate'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import Link from 'src/Link'
import { ModelImage } from 'types/types'

type ModelImageDisplayProps = {
  modelImage: ModelImage
}

export default function ModelImageDisplay({ modelImage }: ModelImageDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  function toggleExpand() {
    setExpanded(!expanded)
  }

  const scanResults = [
    {
      tag: '1.0.0',
      results: [
        {
          _id: '69a99b34c1be0e54d04071cd',
          toolName: 'Trivy',
          artefactKind: 'image',
          layerDigest: 'sha256:1074353eec0db2c1d81d5af2671e56e00cf5738486f5762609ea33d606f88612',
          __v: 0,
          createdAt: '2026-03-05T15:03:16.406Z',
          deleted: false,
          deletedAt: '',
          deletedBy: '',
          lastRunAt: '2026-03-05T15:03:17.077Z',
          scannerVersion: '0.69.1',
          state: 'complete',
          updatedAt: '2026-03-05T15:03:17.080Z',
          severityCounts: {
            unknown: 0,
            low: 0,
            medium: 9,
            high: 2,
            critical: 1,
          },
          imageScanDetail: 'counts',
        },
        {
          _id: '69a99b34c1be0e54d04071cc',
          layerDigest: 'sha256:e7b39c54cdeca0d2aae83114bb605753a5f5bc511fe8be7590e38f6d9f915dad',
          artefactKind: 'image',
          toolName: 'Trivy',
          __v: 0,
          createdAt: '2026-03-05T15:03:16.406Z',
          deleted: false,
          deletedAt: '',
          deletedBy: '',
          lastRunAt: '2026-03-05T15:03:16.725Z',
          scannerVersion: '0.69.1',
          state: 'complete',
          updatedAt: '2026-03-05T15:03:16.727Z',
          severityCounts: {
            unknown: 0,
            low: 0,
            medium: 2,
            high: 0,
            critical: 0,
          },
          imageScanDetail: 'counts',
        },
      ],
    },
  ]

  const getScanResultCounts = (imageTag: string) => {
    const tagResults = scanResults.find((tagResult) => tagResult.tag === imageTag)
    if (tagResults) {
      const combined = tagResults.results.reduce(
        (a, obj) =>
          Object.entries(obj.severityCounts).reduce((a, [key, val]) => {
            a[key] = (a[key] || 0) + val
            return a
          }, a),
        {},
      )
      return combined
    }
  }

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
            <VulnerabilityResult {...getScanResultCounts(data.tag)} />
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
                  <VulnerabilityResult {...getScanResultCounts(imageTag)} />
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </Card>
    </>
  )
}
