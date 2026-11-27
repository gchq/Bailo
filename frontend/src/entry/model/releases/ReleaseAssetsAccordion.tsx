import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material'
import { sumBy } from 'lodash-es'
import prettyBytes from 'pretty-bytes'
import { useContext, useMemo, useState } from 'react'
import UiConfigContext from 'src/contexts/uiConfigContext'
import FileBrowser from 'src/entry/model/files/FileBrowser'
import CodeLine from 'src/entry/model/registry/CodeLine'
import { type EntryInterface, type ReleaseInterface } from 'types/types'
import { plural } from 'utils/stringUtils'

export interface ReleaseAssetsAccordionProps {
  model: EntryInterface
  release: ReleaseInterface
  hideFileDownloads?: boolean
}

export default function ReleaseAssetsAccordion({
  model,
  release,
  hideFileDownloads = false,
}: ReleaseAssetsAccordionProps) {
  const [expanded, setExpanded] = useState<'files' | 'images' | false>(false)

  const uiConfig = useContext(UiConfigContext)

  const totalFileSize = useMemo(() => sumBy(release.files, 'size'), [release.files])

  const handleAccordionChange = (panel: 'files' | 'images') => (_: unknown, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  return (
    <Stack spacing={1}>
      {!hideFileDownloads && release.files.length > 0 && (
        <Accordion
          expanded={expanded === 'files'}
          onChange={handleAccordionChange('files')}
          data-test={`release-files-accordion-${release.semver}`}
        >
          <AccordionSummary sx={{ px: 0 }} expandIcon={<ArrowDropDown />}>
            <Stack direction='row' spacing={1} sx={{ alignItems: 'baseline' }}>
              <Typography
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {`${expanded === 'files' ? 'Hide' : 'Show'} ${plural(release.files.length, 'file')}`}
              </Typography>
              <Typography variant='caption' data-test='release-files-total-size'>
                {`(${prettyBytes(totalFileSize)} total)`}
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {expanded === 'files' && (
              <FileBrowser
                files={release.files}
                modelId={model.id}
                modelKind={model.kind}
                releases={[release]}
                readOnly
              />
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
