import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import Download from '@mui/icons-material/Download'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Stack, Typography } from '@mui/material'
import { memoize } from 'lodash-es'
import { useContext, useState } from 'react'
import Paginate from 'src/common/Paginate'
import ArtefactScanningInfoContext from 'src/contexts/artefactScanningInfoContext'
import UiConfigContext from 'src/contexts/uiConfigContext'
import FileDisplay from 'src/entry/model/files/FileDisplay'
import CodeLine from 'src/entry/model/registry/CodeLine'
import Link from 'src/Link'
import { ArtefactKind, EntryInterface, ReleaseInterface } from 'types/types'
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

  const scanners = useContext(ArtefactScanningInfoContext)
  const uiConfig = useContext(UiConfigContext)

  const handleAccordionChange = (panel: 'files' | 'images') => (_: unknown, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const FileRowItem = memoize(({ data }) => (
    <FileDisplay
      key={data.name}
      file={data}
      modelId={model.id}
      releases={[release]}
      showMenuItems={
        mode === 'interactive'
          ? { rescanFile: scanners.some((scanner) => scanner.artefactKind === ArtefactKind.FILE) }
          : {}
      }
    />
  ))

  return (
    <Stack spacing={1}>
      {!hideFileDownloads && release.files.length > 0 && (
        <Accordion
          expanded={expanded === 'files'}
          onChange={handleAccordionChange('files')}
          data-test={`release-files-accordion-${release.semver}`}
        >
          <AccordionSummary sx={{ px: 0 }} expandIcon={<ArrowDropDown />}>
            <Typography
              sx={{
                fontWeight: 'bold',
              }}
            >
              {`${expanded === 'files' ? 'Hide' : 'Show'} ${plural(release.files.length, 'file')}`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {expanded === 'files' && (
              <Stack spacing={2}>
                <Button
                  component={Link}
                  href={`/api/v2/model/${model.id}/release/${release.semver}/files/download`}
                  startIcon={<Download />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Download all files
                </Button>
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
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>
      )}
      {release.images.length > 0 && (
        <Accordion expanded={expanded === 'images'} onChange={handleAccordionChange('images')}>
          <AccordionSummary sx={{ px: 0 }} expandIcon={<ArrowDropDown />}>
            <Typography
              sx={{
                fontWeight: 'bold',
              }}
            >
              {`${expanded === 'images' ? 'Hide' : 'Show'} ${plural(release.images.length, 'Docker image')}`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {expanded === 'images' && (
              <Stack spacing={1}>
                {release.images.map((image) => (
                  <Box key={`${image.repository}-${image.name}-${image.tag}`}>
                    <CodeLine line={`${uiConfig.registry.host}/${model.id}/${image.name}:${image.tag}`} />
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
