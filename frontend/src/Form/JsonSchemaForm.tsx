import Error from '@mui/icons-material/ErrorOutlineOutlined'
import {
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Stepper,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Form from '@rjsf/mui'
import { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { debounce } from 'lodash-es'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { RouterQueryParams } from 'src/entry/overview/FormEditPage'
import {
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  DescriptionFieldTemplate,
  ErrorListTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
} from 'src/Form/FormTemplates'
import { LinearProgressWithLabel } from 'src/Form/ProgressBar'
import ValidationErrorIcon from 'src/Form/ValidationErrorIcon'
import useCopyToClipboard from 'src/hooks/useCopyToClipboard'
import MessageAlert from 'src/MessageAlert'
import Nothing from 'src/MuiForms/Nothing'
import { SplitSchemaNoRender } from 'types/types'
import {
  getFormStats,
  getOverallCompletionStats,
  setFormDataPropertiesToUndefined,
  setStepState,
  widgets,
} from 'utils/formUtils'
import { toSentenceCase } from 'utils/stringUtils'

export default function JsonSchemaForm({
  splitSchema,
  setSplitSchema,
  calculateStats = 0,
  canEdit = false,
  displayLabelValidation = false,
  defaultCurrentUserInEntityList = false,
  mirroredModel = false,
  displayStats = false,
  stateList,
}: {
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  calculateStats?: number // a number to be incremented in order to re-run stats
  canEdit?: boolean
  displayLabelValidation?: boolean
  defaultCurrentUserInEntityList?: boolean
  mirroredModel?: boolean
  displayStats?: boolean
  stateList?: string[]
}) {
  const theme = useTheme()
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<number>(
    router.query && router.query.page !== undefined && typeof router.query.page === 'string'
      ? Number(router.query.page)
      : 0,
  )
  const requiredByModelState = router.query.requiredByModelState as string
  const [sectionCompletion, setSectionCompletion] = useState<Record<string, number>>(() =>
    splitSchema.steps.reduce<Record<string, number>>((acc, step) => {
      acc[step.schema.title] = 0
      return acc
    }, {}),
  )

  useEffect(() => {
    if (!canEdit) {
      return
    }
    if (!requiredByModelState) {
      setSectionCompletion((prev) => {
        const resetCompletion = splitSchema.steps.reduce<Record<string, number>>((acc, step) => {
          acc[step.schema.title] = 0
          return acc
        }, {})
        const prevKeys = Object.keys(prev)
        const nextKeys = Object.keys(resetCompletion)
        const unchanged =
          prevKeys.length === nextKeys.length && nextKeys.every((key) => prev[key] === resetCompletion[key])
        return unchanged ? prev : resetCompletion
      })
      return
    }
    const nextCompletion = splitSchema.steps.reduce<Record<string, number>>((acc, step) => {
      const { totalQuestions, totalAnswers } = getFormStats(step, mirroredModel, requiredByModelState)
      acc[step.schema.title] = Math.max(0, totalQuestions - totalAnswers)
      return acc
    }, {})

    setSectionCompletion((prev) => {
      const prevKeys = Object.keys(prev)
      const nextKeys = Object.keys(nextCompletion)
      const unchanged =
        prevKeys.length === nextKeys.length && nextKeys.every((key) => prev[key] === nextCompletion[key])
      return unchanged ? prev : nextCompletion
    })
  }, [splitSchema, mirroredModel, requiredByModelState, canEdit])
  const sharedSection = router.asPath.split('#')[1] ? (router.asPath.split('#')[1] as string) : ''

  const ref = useRef<HTMLDivElement | null>(null)

  const copyToClipboard = useCopyToClipboard()

  const currentStep = splitSchema.steps[activeStep]

  const source = structuredClone(currentStep ? currentStep.mirroredState : {})
  const target = structuredClone(currentStep ? currentStep.state : {})

  setFormDataPropertiesToUndefined(source)

  const updatedMirroredState = { ...JSON.parse(JSON.stringify(source)), ...JSON.parse(JSON.stringify(target)) }

  const formStats = useMemo(
    () => getFormStats(currentStep, mirroredModel, requiredByModelState || undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep, currentStep?.state, mirroredModel, requiredByModelState],
  )

  const collatedStats = useMemo(
    () => getOverallCompletionStats(splitSchema.steps, mirroredModel, requiredByModelState || undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [splitSchema, calculateStats, mirroredModel, requiredByModelState],
  )

  const updatePageByRouterQuery = useEffectEvent((page: string) => {
    setActiveStep(Number(page) || 0)
  })

  useEffect(() => {
    if (router.query.page !== undefined && typeof router.query.page === 'string') {
      updatePageByRouterQuery(router.query.page)
    }
  }, [router])

  useEffect(() => {
    if (ref && sharedSection) {
      const section = document.getElementById(sharedSection) as HTMLElement
      if (!section) {
        return
      }
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ref, sharedSection])

  if (!currentStep) {
    return null
  }

  const onFormChange = debounce((form: RJSFSchema) => {
    if (form.schema.title === currentStep.schema.title) {
      setStepState(splitSchema, setSplitSchema, currentStep, { ...currentStep.state, ...form.formData })
    }
  }, 100)

  function handleListItemClick(index: number) {
    setActiveStep(index)
    router.replace({
      query: { ...router.query, page: index } as RouterQueryParams,
    })
  }

  function onShareSectionOnClick(sectionId: string) {
    const link = `${window.location.origin}${window.location.pathname}?page=${activeStep}#${sectionId}`

    copyToClipboard(link, 'Link saved to clipboard', 'Failed to save link to clipboard', {
      horizontal: 'center',
      vertical: 'bottom',
    })
  }

  const handleHighlightStateClick = (state: string) => {
    if (state === requiredByModelState) {
      const { ...queries } = router.query
      delete queries.requiredByModelState
      router.replace({ query: queries })
    } else {
      router.replace({
        query: { ...router.query, requiredByModelState: state } as RouterQueryParams,
      })
    }
  }

  if (requiredByModelState && !stateList?.includes(requiredByModelState)) {
    return (
      <MessageAlert
        message={`Invalid query parameter requiredByModelState ("${requiredByModelState}")`}
        severity='error'
      />
    )
  }

  return (
    <Stack>
      {displayStats && (
        <Box>
          <Box sx={{ mb: 1 }}>
            Pages Completed: {collatedStats.pagesCompleted}/{collatedStats.totalPages}
          </Box>
        </Box>
      )}
      {displayStats && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 2 }}>
            <LinearProgressWithLabel value={collatedStats.percentagePagesComplete} showLabel={false} />
          </Grid>
          <Grid size={{ xs: 12, md: 10 }} />
        </Grid>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 2 }} sx={{ borderRight: 1, borderColor: theme.palette.divider }}>
          <Stepper activeStep={activeStep} nonLinear alternativeLabel orientation='vertical' connector={<Nothing />}>
            <List sx={{ width: { xs: '100%' } }}>
              {splitSchema.steps.map((step, index) => (
                <ListItem
                  key={step.schema.title}
                  disablePadding
                  sx={{
                    backgroundColor:
                      canEdit && sectionCompletion[step.schema.title]
                        ? alpha(theme.palette.error.main, 0.1)
                        : undefined,
                  }}
                >
                  <ListItemButton selected={activeStep === index} onClick={() => handleListItemClick(index)}>
                    <ListItemText sx={{ pr: 1 }}>
                      <Typography
                        sx={{
                          wordBreak: 'break-word',
                          color:
                            !step.isComplete(step) && displayLabelValidation ? 'error' : theme.palette.common.black,
                        }}
                      >
                        {step.schema.title}
                      </Typography>
                    </ListItemText>
                    {canEdit && sectionCompletion[step.schema.title] ? (
                      <ListItemIcon sx={{ minWidth: 'auto', flexShrink: 0, ml: 'auto' }}>
                        <Error color='error' />
                      </ListItemIcon>
                    ) : null}
                    {displayLabelValidation && <ValidationErrorIcon step={step} />}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Stepper>
        </Grid>
        <Grid size={{ xs: 12, md: 10 }} ref={ref}>
          {displayStats && (
            <Box>
              <Box>
                {toSentenceCase(
                  `${requiredByModelState ? `${requiredByModelState} ` : ''}fields completed: ${formStats.totalAnswers}/${formStats.totalQuestions}`,
                )}
              </Box>
              <LinearProgressWithLabel value={formStats.percentageQuestionsComplete} />
            </Box>
          )}
          {canEdit && (
            <Stack spacing={1}>
              {stateList && stateList.length > 0 && (
                <Stack spacing={2} direction='row' sx={{ alignItems: 'center' }}>
                  <Typography>Highlight fields by: </Typography>
                  {stateList.map((state) => (
                    <Tooltip key={state} title={`Highlight questions required for ${state}`}>
                      <Chip
                        key={state}
                        label={state}
                        onClick={() => handleHighlightStateClick(state)}
                        color={requiredByModelState === state ? 'primary' : 'default'}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              )}
              <Typography sx={{ pt: 1 }}>
                Required fields for this state are marked with an asterisk
                <span style={{ color: theme.palette.error.main }}> *</span>
              </Typography>
            </Stack>
          )}
          <Form
            schema={currentStep.schema}
            formData={updatedMirroredState}
            onChange={onFormChange}
            validator={validator}
            widgets={widgets}
            uiSchema={currentStep.uiSchema}
            omitExtraData
            disabled={!canEdit}
            liveOmit
            formContext={{
              editMode: canEdit,
              formSchema: currentStep.schema,
              defaultCurrentUser: defaultCurrentUserInEntityList,
              mirroredState: currentStep.mirroredState,
              state: currentStep.state,
              mirroredModel,
              onShare: onShareSectionOnClick,
              requiredByModelState: requiredByModelState,
            }}
            templates={
              !canEdit
                ? {
                    DescriptionFieldTemplate,
                    ArrayFieldTemplate,
                    ArrayFieldItemTemplate,
                    ObjectFieldTemplate,
                  }
                : {
                    DescriptionFieldTemplate,
                    ArrayFieldTemplate,
                    ArrayFieldItemTemplate,
                    ObjectFieldTemplate,
                    ErrorListTemplate,
                    FieldTemplate,
                  }
            }
          >
            <></>
          </Form>
        </Grid>
      </Grid>
    </Stack>
  )
}
