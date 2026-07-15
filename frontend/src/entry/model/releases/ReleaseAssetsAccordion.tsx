import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import FileBrowser from 'src/entry/model/files/FileBrowser'
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

  const { uiConfig } = useGetUiConfig()

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
              <FileBrowser
                files={release.files}
                modelId={model.id}
                modelKind={model.kind}
                releases={[release]}
                readOnly={mode === 'readonly'}
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
