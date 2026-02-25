import { ExpandLess, ExpandMore, LocalOffer } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { ModelImage } from 'types/types'

type ModelImageDisplayProps = {
  modelImage: ModelImage
}

export default function ModelImageDisplay({ modelImage }: ModelImageDisplayProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [expanded, setExpanded] = useState(false)

  function toggleExpand() {
    setExpanded(!expanded)
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
            <VulnerabilityResult />
          </Stack>
        </Grid>
        <Grid size='auto'>
          <Stack direction={{ sm: 'column', md: 'row' }} alignItems='center' spacing={2}>
            <Typography fontWeight='bold'>URI: </Typography>
            <CodeLine
              line={`${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelImage.repository}/${modelImage.name}:${data.tag}`}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <>
      {isUiConfigLoading && <Loading />}
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
                <Grid container alignItems='center' spacing={2}>
                  <Grid size={2}>
                    <Stack direction='row' alignItems='center' justifyContent='left' spacing={2}>
                      <LocalOffer color='primary' />
                      <Link href={`/model/${modelImage.repository}/registry/${modelImage.name}/${imageTag}`}>
                        <Button size='large' color='primary'>
                          {imageTag}
                        </Button>
                      </Link>
                    </Stack>
                  </Grid>
                  <Grid size='auto'>
                    <Stack
                      direction={{ sm: 'column', md: 'row' }}
                      alignItems='center'
                      justifyContent='left'
                      spacing={2}
                    >
                      <Typography fontWeight='bold'>Vulnerabilities: </Typography>
                      <VulnerabilityResult />
                    </Stack>
                  </Grid>
                  <Grid size='auto'>
                    <Stack direction={{ sm: 'column', md: 'row' }} alignItems='center' spacing={2}>
                      <Typography fontWeight='bold'>URI: </Typography>
                      <CodeLine
                        line={`${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelImage.repository}/${modelImage.name}:${imageTag}`}
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            ))
          )}
        </Stack>
      </Card>
    </>
  )
}
