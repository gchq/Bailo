import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Card, Stack, Typography } from '@mui/material'
import { memoize } from 'lodash-es'
import { useState } from 'react'
import Paginate from 'src/common/Paginate'
import ModelImageTagDisplay from 'src/entry/model/registry/ModelImageTagDisplay'
import { ModelImagesWithOptionalScanResults } from 'types/types'

type ModelImageDisplayProps = {
  modelImage: ModelImagesWithOptionalScanResults
  mutate: () => void
}

export default function ModelImageDisplay({ modelImage, mutate }: ModelImageDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  function toggleExpand() {
    setExpanded(!expanded)
  }

  const modelImageTag = (tag: string) => <ModelImageTagDisplay modelImage={modelImage} tag={tag} mutate={mutate} />

  const modelImageTagRow = memoize(({ data }) => modelImageTag(data.tag))

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
