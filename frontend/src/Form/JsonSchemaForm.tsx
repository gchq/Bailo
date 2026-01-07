import { Grid, List, ListItem, ListItemButton, Stepper, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Form from '@rjsf/mui'
import { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  DescriptionFieldTemplate,
  ObjectFieldTemplate,
} from 'src/Form/FormTemplates'
import ValidationErrorIcon from 'src/Form/ValidationErrorIcon'
import useNotification from 'src/hooks/useNotification'
import Nothing from 'src/MuiForms/Nothing'
import { SplitSchemaNoRender } from 'types/types'
import { setStepState, widgets } from 'utils/formUtils'

export default function JsonSchemaForm({
  splitSchema,
  setSplitSchema,
  canEdit = false,
  displayLabelValidation = false,
  defaultCurrentUserInEntityList = false,
}: {
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  canEdit?: boolean
  displayLabelValidation?: boolean
  defaultCurrentUserInEntityList?: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [sharedSection, setSharedSection] = useState('')
  const theme = useTheme()
  const router = useRouter()
  const ref = useRef<HTMLDivElement | null>(null)
  const sendNotification = useNotification()

  const currentStep = splitSchema.steps[activeStep]

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
    navigator.clipboard.writeText(
      `${window.location.origin + window.location.pathname}?page=${activeStep}#${sectionId}`,
    )
    sendNotification({
      variant: 'success',
      msg: `Link saved to clipboard`,
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
    })
  }

  return (
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
                      color: !step.isComplete(step) ? theme.palette.error.main : theme.palette.common.black,
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
  )
}
