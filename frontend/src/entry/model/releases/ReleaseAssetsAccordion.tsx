import { ArrowDropDown } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material'
import { useGetFileScannerInfo } from 'actions/fileScanning'
import { useGetUiConfig } from 'actions/uiConfig'
import { memoize } from 'lodash-es'
import { useState } from 'react'
import Paginate from 'src/common/Paginate'
import FileDisplay from 'src/entry/model/files/FileDisplay'
import CodeLine from 'src/entry/model/registry/CodeLine'
import { EntryInterface, ReleaseInterface } from 'types/types'
import { plural } from 'utils/stringUtils'

export interface ReleaseAssetsAccordionProps {
  model: EntryInterface
  release: ReleaseInterface
  mode: 'readonly' | 'interactive'
  hideFileDownloads?: boolean
}

export default function ReleaseAssetsAccordion({
  model,
  release,
  mode,
  hideFileDownloads = false,
}: ReleaseAssetsAccordionProps) {
  const [expanded, setExpanded] = useState<'files' | 'images' | false>(false)

  const { scanners } = useGetFileScannerInfo()
  const { uiConfig } = useGetUiConfig()

  const handleAccordionChange = (panel: 'files' | 'images') => (_: unknown, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const FileRowItem = memoize(({ data }) => (
    <FileDisplay
      key={data.name}
      file={data}
      modelId={model.id}
      releases={[release]}
      showMenuItems={mode === 'interactive' ? { rescanFile: scanners.length > 0 } : {}}
    />
  ))

  return (
    <Stack spacing={1}>
      {!hideFileDownloads && release.files.length > 0 && (
        <Accordion expanded={expanded === 'files'} onChange={handleAccordionChange('files')}>
          <AccordionSummary sx={{ px: 0 }} expandIcon={<ArrowDropDown />}>
            <Typography fontWeight='bold'>
              {`${expanded === 'files' ? 'Hide' : 'Show'} ${plural(release.files.length, 'file')}`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {expanded === 'files' && (
              <Paginate
                list={release.files}
                defaultSortProperty='createdAt'
                searchFilterProperty='name'
                searchPlaceholderText='Search by filename'
                emptyListText='No files found'
                sortingProperties={[
                  { value: 'name', title: 'Name', iconKind: 'text' },
                  { value: 'size', title: 'Size', iconKind: 'size' },
                  {
                    value: 'createdAt',
                    title: 'Date uploaded',
                    iconKind: 'date',
                  },
                  {
                    value: 'updatedAt',
                    title: 'Date updated',
                    iconKind: 'date',
                  },
                ]}
              >
                {FileRowItem}
              </Paginate>
            )}
          </AccordionDetails>
        </Accordion>
      )}
      {release.images.length > 0 && (
        <Accordion expanded={expanded === 'images'} onChange={handleAccordionChange('images')}>
          <AccordionSummary sx={{ px: 0 }} expandIcon={<ArrowDropDown />}>
            <Typography fontWeight='bold'>
              {`${expanded === 'images' ? 'Hide' : 'Show'} ${plural(release.images.length, 'Docker image')}`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {expanded === 'images' && (
              <Stack spacing={1}>
                {release.images.map((image) => (
                  <Box key={`${image.repository}-${image.name}-${image.tag}`}>
                    {uiConfig && <CodeLine line={`${uiConfig.registry.host}/${model.id}/${image.name}:${image.tag}`} />}
                  </Box>
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  )
}
