import { Box, Grid, List, ListItem, ListItemButton, Stack, Stepper, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Form from '@rjsf/mui'
import { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import {
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  DescriptionFieldTemplate,
  ObjectFieldTemplate,
} from 'src/Form/FormTemplates'
import { LinearProgressWithLabel } from 'src/Form/ProgressBar'
import ValidationErrorIcon from 'src/Form/ValidationErrorIcon'
import useCopyToClipboard from 'src/hooks/useCopyToClipboard'
import Nothing from 'src/MuiForms/Nothing'
import { SplitSchemaNoRender } from 'types/types'
import { getFormStats, getOverallCompletionStats, setStepState, widgets } from 'utils/formUtils'

export default function JsonSchemaForm({
  splitSchema,
  setSplitSchema,
  calculateStats = 0,
  canEdit = false,
  displayLabelValidation = false,
  defaultCurrentUserInEntityList = false,
  displayStats = false,
}: {
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  calculateStats?: number // a number to be incremented in order to re-run stats
  canEdit?: boolean
  displayLabelValidation?: boolean
  defaultCurrentUserInEntityList?: boolean
  displayStats?: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [sharedSection, setSharedSection] = useState('')
  const theme = useTheme()
  const router = useRouter()
  const ref = useRef<HTMLDivElement | null>(null)

  const copyToClipboard = useCopyToClipboard()

  const currentStep = splitSchema.steps[activeStep]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const formStats = useMemo(() => getFormStats(currentStep), [currentStep, calculateStats])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const collatedStats = useMemo(() => getOverallCompletionStats(splitSchema.steps), [splitSchema, calculateStats])

  const updatePageByRouterQuery = useEffectEvent((page: string) => {
    setActiveStep(Number(page) || 0)
  })

  const updatedSharedStateEvent = useEffectEvent((id: string) => {
    setSharedSection(id)
  })

  useEffect(() => {
    if (router.query.page !== undefined && typeof router.query.page === 'string') {
      updatePageByRouterQuery(router.query.page)
    }
    if (router.asPath.split('#')[1]) {
      updatedSharedStateEvent(router.asPath.split('#')[1] as string)
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

  const onFormChange = (form: RJSFSchema) => {
    if (form.schema.title === currentStep.schema.title) {
      setStepState(splitSchema, setSplitSchema, currentStep, { ...currentStep.state, ...form.formData })
    }
  }

  function handleListItemClick(index: number) {
    setActiveStep(index)
    router.replace({
      query: { ...router.query, page: index },
    })
  }

  function ErrorListTemplate() {
    return (
      <Typography color={theme.palette.error.main} sx={{ mb: 2 }}>
        Please make sure that all errors listed below have been resolved.
      </Typography>
    )
  }

  function onShareSectionOnClick(sectionId: string) {
    const link = `${window.location.origin}${window.location.pathname}?page=${activeStep}#${sectionId}`

    copyToClipboard(link, 'Link saved to clipboard', 'Failed to save link to clipboard', {
      horizontal: 'center',
      vertical: 'bottom',
    })
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
                  sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}
                >
                  <ListItemButton selected={activeStep === index} onClick={() => handleListItemClick(index)}>
                    <Typography
                      sx={{
                        wordBreak: 'break-word',
                        color:
                          !step.isComplete(step) && displayLabelValidation
                            ? theme.palette.error.main
                            : theme.palette.common.black,
                      }}
                      width='100%'
                    >
                      {step.schema.title}
                    </Typography>
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
                Entries Completed: {formStats.totalAnswers}/{formStats.totalQuestions}
              </Box>
              <LinearProgressWithLabel value={formStats.percentageQuestionsComplete} />
            </Box>
          )}
          <Form
            schema={currentStep.schema}
            formData={currentStep.state}
            onChange={onFormChange}
            validator={validator}
            widgets={widgets}
            uiSchema={currentStep.uiSchema}
            liveValidate
            omitExtraData
            disabled={!canEdit}
            liveOmit
            formContext={{
              editMode: canEdit,
              formSchema: currentStep.schema,
              defaultCurrentUser: defaultCurrentUserInEntityList,
              onShare: onShareSectionOnClick,
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
                    ArrayFieldTemplate,
                    ArrayFieldItemTemplate,
                    ObjectFieldTemplate,
                    ErrorListTemplate,
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
