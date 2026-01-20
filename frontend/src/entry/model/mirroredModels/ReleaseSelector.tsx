import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import ClearIcon from '@mui/icons-material/Clear'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useGetFileScannerInfo } from 'actions/fileScanning'
import { useGetReleasesForModelId } from 'actions/release'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useGetUiConfig } from 'actions/uiConfig'
import { memoize } from 'lodash-es'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Paginate from 'src/common/Paginate'
import UserDisplay from 'src/common/UserDisplay'
import FileDisplay from 'src/entry/model/files/FileDisplay'
import CodeLine from 'src/entry/model/registry/CodeLine'
import ReviewDisplay from 'src/entry/model/reviews/ReviewDisplay'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, ReleaseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { plural } from 'utils/stringUtils'

type ReleaseSelectorProps = {
  model: EntryInterface
  selectedReleases: ReleaseInterface[]
  onUpdateSelectedReleases: (values: ReleaseInterface[]) => void
  isReadOnly: boolean
  requiredRolesText: string
}

type ReleaseRowProps = {
  model: EntryInterface
  release: ReleaseInterface
  isSelected: boolean
  toggleRelease: (release: ReleaseInterface) => void
  isReadOnly: boolean
}

function ReleaseRow({ model, release, isSelected, toggleRelease, isReadOnly }: ReleaseRowProps) {
  const [expanded, setExpanded] = useState<string | false>(false)

  const { scanners } = useGetFileScannerInfo()
  const { uiConfig } = useGetUiConfig()

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: model.id,
    semver: release.semver,
  })

  const {
    responses: reviewResponses,
    isResponsesLoading,
    isResponsesError,
  } = useGetResponses(reviews.map((r) => r._id))

  const handleAccordionChange = (panel: string) => (_: unknown, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const FileRowItem = memoize(({ data }) => (
    <FileDisplay
      showMenuItems={{ rescanFile: scanners.length > 0 }}
      key={data.name}
      file={data}
      modelId={model.id}
      releases={[release]}
    />
  ))

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Grid container spacing={2} alignItems='flex-start' p={2}>
        {/* Checkbox */}
        <Grid size={{ xs: 1 }}>
          <Checkbox checked={isSelected} disabled={isReadOnly} onChange={() => toggleRelease(release)} />
        </Grid>
        {/* Main content */}
        <Grid size={{ xs: 11 }}>
          <Stack spacing={1}>
            {/* Header */}
            <Link noLinkStyle href={`/model/${model.id}/release/${release.semver}`}>
              <Typography variant='h6' color='primary'>
                {release.semver}
              </Typography>
            </Link>
            {/* Metadata */}
            <Stack direction='row' spacing={0.5} alignItems='center'>
              <Typography variant='caption'>Created by</Typography>
              <UserDisplay dn={release.createdBy} />
              <Typography variant='caption'>on</Typography>
              <Typography variant='caption' fontWeight='bold'>
                {formatDateString(release.createdAt)}
              </Typography>
            </Stack>
            {/* Review status */}
            {!release.minor && (
              <>
                {(isReviewsLoading || isResponsesLoading) && <Loading />}
                {(isReviewsError || isResponsesError) && (
                  <MessageAlert message='Unable to load review status' severity='error' />
                )}
                {!isReviewsLoading && !isResponsesLoading && !isReviewsError && !isResponsesError && (
                  <ReviewDisplay modelId={model.id} reviewResponses={reviewResponses} />
                )}
              </>
            )}
            {/* Notes */}
            {release.notes && <MarkdownDisplay>{release.notes}</MarkdownDisplay>}
            {/* Files accordion */}
            {release.files.length > 0 && (
              <Accordion
                expanded={expanded === 'filesPanel'}
                onChange={handleAccordionChange('filesPanel')}
                data-test={`release-files-accordion-${release.semver}`}
              >
                <AccordionSummary sx={{ px: 0 }} expandIcon={<ArrowDropDown />}>
                  <Typography fontWeight='bold'>
                    {`${expanded === 'filesPanel' ? 'Hide' : 'Show'} ${plural(release.files.length, 'file')}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
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
                </AccordionDetails>
              </Accordion>
            )}
            {/* Images accordion */}
            {release.images.length > 0 && (
              <Accordion expanded={expanded === 'imagesPanel'} onChange={handleAccordionChange('imagesPanel')}>
                <AccordionSummary sx={{ px: 0 }} expandIcon={<ArrowDropDown />}>
                  <Typography fontWeight='bold'>
                    {`${expanded === 'imagesPanel' ? 'Hide' : 'Show'} ${plural(release.images.length, 'Docker image')}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {release.images.map((image) => (
                    <Stack
                      key={`${image.repository}-${image.name}-${image.tag}`}
                      direction={{ sm: 'row', xs: 'column' }}
                      justifyContent='space-between'
                      alignItems='center'
                      spacing={1}
                    >
                      {uiConfig && (
                        <CodeLine line={`${uiConfig.registry.host}/${model.id}/${image.name}:${image.tag}`} />
                      )}
                    </Stack>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

export default function ReleaseSelector({
  model,
  selectedReleases,
  onUpdateSelectedReleases,
  isReadOnly,
  requiredRolesText,
}: ReleaseSelectorProps) {
  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const selectedSemvers = useMemo(() => new Set(selectedReleases.map((r) => r.semver)), [selectedReleases])

  const toggleRelease = (release: ReleaseInterface) => {
    if (selectedSemvers.has(release.semver)) {
      onUpdateSelectedReleases(selectedReleases.filter((r) => r.semver !== release.semver))
    } else {
      onUpdateSelectedReleases([...selectedReleases, release])
    }
  }

  const removeSelectedRelease = (semver: string) => {
    onUpdateSelectedReleases(selectedReleases.filter((r) => r.semver !== semver))
  }

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isReleasesLoading) {
    return <Loading />
  }

  return (
    <Stack spacing={3} width='100%'>
      <Typography fontWeight='bold'>Select Releases</Typography>
      <Tooltip title={requiredRolesText}>
        <Typography variant='caption' color='text.secondary'>
          Select one or more releases to export.
        </Typography>
      </Tooltip>
      <Paginate
        list={releases}
        defaultSortProperty='createdAt'
        searchFilterProperty='semver'
        searchPlaceholderText='Search by semver'
        emptyListText='No releases found'
        sortingProperties={[
          { value: 'semver', title: 'Version', iconKind: 'text' },
          { value: 'createdAt', title: 'Created', iconKind: 'date' },
        ]}
      >
        {({ data }: { data: ReleaseInterface }) => (
          <ReleaseRow
            model={model}
            release={data}
            isSelected={selectedSemvers.has(data.semver)}
            toggleRelease={toggleRelease}
            isReadOnly={isReadOnly}
          />
        )}
      </Paginate>
      {/* Selected releases summary */}
      {selectedReleases.length > 0 && (
        <Box>
          <Typography variant='subtitle2' gutterBottom>
            Selected releases
          </Typography>
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            {selectedReleases.map((release) => (
              <Chip
                key={release.semver}
                label={release.semver}
                onDelete={isReadOnly ? undefined : () => removeSelectedRelease(release.semver)}
                deleteIcon={<ClearIcon />}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
