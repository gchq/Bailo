import ArrowBack from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModel } from 'actions/entry'
import { useGetRelease, useGetReleasesForModelId } from 'actions/release'
import { postReviewResponse, useGetReviewRequestsForModel } from 'actions/review'
import { useGetSchema } from 'actions/schema'
import { memoize } from 'lodash'
import { useRouter } from 'next/router'
import { useContext, useEffect, useEffectEvent, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import ReviewPopper from 'src/common/ReviewPopper'
import Title from 'src/common/Title'
import UserDisplay from 'src/common/UserDisplay'
import ArtefactScanningInfoContext from 'src/contexts/artefactScanningInfoContext'
import FileDisplay from 'src/entry/model/files/FileDisplay'
import ModelImageList from 'src/entry/model/ModelImageList'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import Link from 'src/Link'
import { ArtefactKind, DecisionKeys, FileInterface, isFileInterface, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema } from 'utils/formUtils'

export default function ReleaseReview() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const [errorMessage, setErrorMessage] = useState('')
  const [isReviewButtonLoading, setIsReviewButtonLoading] = useState(false)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })

  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetModel(modelId)
  const { release, isReleaseLoading, isReleaseError } = useGetRelease(modelId, semver)
  const { releases, isReleasesLoading, isReleasesError, mutateReleases } = useGetReleasesForModelId(modelId)
  const { reviews, isReviewsLoading, isReviewsError, mutateReviews } = useGetReviewRequestsForModel({
    modelId: modelId as string,
    semver: `${semver}`,
  })
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.card.schemaId || '')

  const onSplitSchemaChange = useEffectEvent((newSplitSchema: SplitSchemaNoRender) => {
    setSplitSchema(newSplitSchema)
  })

  const theme = useTheme()
  const scanners = useContext(ArtefactScanningInfoContext)

  const isLgOrLarger = useMediaQuery(theme.breakpoints.up('lg'))

  useEffect(() => {
    if (!model || !schema) {
      return
    }
    const steps = getStepsFromSchema(
      schema,
      {},
      ['properties.contacts'],
      model.card.metadata,
      model.mirroredCard?.metadata || {},
    )
    for (const step of steps) {
      step.steps = steps
    }
    onSplitSchemaChange({ reference: schema.id, steps })
  }, [schema, model])

  async function handleSubmit(decision: DecisionKeys, comment: string, role: string) {
    setErrorMessage('')
    if (!modelId) {
      return setErrorMessage('Could not find model ID')
    }
    if (!semver) {
      return setErrorMessage('Could not find release semver')
    }

    setIsReviewButtonLoading(true)
    const res = await postReviewResponse({
      modelId,
      role,
      comment,
      decision,
      semver,
    })

    if (!res.ok) {
      setIsReviewButtonLoading(false)
      setErrorMessage(await getErrorMessage(res))
    } else {
      mutateReviews()
      mutateReleases()
      router.push(`/model/${modelId}/release/${semver}`)
    }
  }

  const FileRowItem = memoize(({ data }) =>
    isFileInterface(data) && model ? (
      <FileDisplay
        key={data.name}
        file={data}
        modelId={model.id}
        showMenuItems={{ rescanFile: scanners.some((scanner) => scanner.artefactKind === ArtefactKind.FILE) }}
        mutator={mutateReleases}
        style={{ padding: 1 }}
        releases={releases}
      />
    ) : (
      <></>
    ),
  )

  const error = MultipleErrorWrapper('Unable to load release review page', {
    isReleaseError,
    isModelError,
    isReviewsError,
    isReleasesError,
    isSchemaError,
  })
  if (error) {
    return error
  }

  if (
    !release ||
    !model ||
    !reviews ||
    !releases ||
    !schema ||
    isReviewsLoading ||
    isReleaseLoading ||
    isModelLoading ||
    isReleasesLoading ||
    isSchemaLoading
  ) {
    return <Loading />
  }

  return (
    <>
      <Title text={semver ? semver : 'Loading...'} />
      <Container maxWidth='xl'>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
              <Stack
                spacing={2}
                sx={{ alignItems: 'center' }}
                direction='row'
                divider={<Divider flexItem orientation='vertical' />}
              >
                <Link href={`/model/${modelId}/release/${semver}`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to release
                  </Button>
                </Link>
                <Typography variant='h6' component='h1' color='primary'>
                  Reviewing release <span style={{ fontWeight: 'bold' }}>{release.semver}</span> for{' '}
                  <span style={{ fontWeight: 'bold' }}>{model.name}</span>
                </Typography>
              </Stack>
              <ReviewPopper
                reviews={reviews}
                onSubmit={handleSubmit}
                includeDueDate={false}
                isLoading={isReviewButtonLoading}
                errorMessage={errorMessage}
              />
            </Stack>
          </Paper>
          <Stack direction={{ md: 'column', lg: 'row' }} spacing={2}>
            <Paper sx={{ p: 4, width: isLgOrLarger ? '40%' : '100%' }}>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 'bold' }}>Created by</Typography>
                  <UserDisplay dn={release.createdBy} />
                </Stack>
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 'bold' }}>Release notes</Typography>
                  <Typography>{release.notes}</Typography>
                </Stack>
                <Box>
                  <Accordion sx={{ p: 0 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 'bold',
                        }}
                      >{`Files (${release.files.length})`}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1} divider={<Divider />}>
                        <Paginate
                          list={release.files as FileInterface[]}
                          defaultSortProperty='name'
                          searchFilterProperty='name'
                          searchPlaceholderText='Search by filename'
                          sortingProperties={[
                            { value: 'name', title: 'Name', iconKind: 'text' },
                            { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
                            { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
                          ]}
                        >
                          {FileRowItem}
                        </Paginate>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                <Box>
                  <Accordion sx={{ p: 0 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 0 }}>
                      <Typography
                        sx={{ fontWeight: 'bold' }}
                        component='label'
                        htmlFor='image-input'
                      >{`Images (${release.images.length})`}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <ModelImageList
                        multiple
                        model={model}
                        value={release.images}
                        readOnly
                        onChange={() => {}}
                        onRegistryError={() => {}}
                        id='image-input'
                      />
                      {release.images.length === 0 && <EmptyBlob text='No images found' />}
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </Stack>
            </Paper>
            <Paper sx={{ p: 4, width: '100%' }}>
              <Typography sx={{ fontWeight: 'bold' }}>Model card version: {release.modelCardVersion}</Typography>
              <Box sx={{ width: '100%' }}>
                <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={false} />
              </Box>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </>
  )
}
