import { Grid2, List, ListItem, ListItemButton, Stepper, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Form from '@rjsf/mui'
import { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { Dispatch, SetStateAction, useState } from 'react'
import { DescriptionFieldTemplate, TitleFieldTemplate } from 'src/Form/FormTemplates'
import ValidationErrorIcon from 'src/Form/ValidationErrorIcon'
import Nothing from 'src/MuiForms/Nothing'
import QuestionViewer from 'src/MuiForms/QuestionViewer'
import { SplitSchemaNoRender } from 'types/types'
import { setStepState } from 'utils/formUtils'

export interface QuestionSelection {
  path: string
  schema: any
}

// TODO - add validation BAI-866
export default function JsonSchemaViewer({
  splitSchema,
  setSplitSchema,
  canEdit = false,
  displayLabelValidation = false,
  defaultCurrentUserInEntityList = false,
  onQuestionClick,
}: {
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  canEdit?: boolean
  displayLabelValidation?: boolean
  defaultCurrentUserInEntityList?: boolean
  onQuestionClick?: (selection: QuestionSelection) => void
}) {
  const [activeStep, setActiveStep] = useState(0)
  const theme = useTheme()

  const currentStep = splitSchema.steps[activeStep]

  if (!currentStep) {
    return null
  }

  const widgets = {
    TextWidget: QuestionViewer,
    CheckboxWidget: QuestionViewer,
    TextareaWidget: QuestionViewer,
    DateWidget: QuestionViewer,
    tagSelector: QuestionViewer,
    entitySelector: QuestionViewer,
    SelectWidget: QuestionViewer,
    multiSelector: QuestionViewer,
    dataCardSelector: QuestionViewer,
    metricsWidget: QuestionViewer,
    nothing: Nothing,
  }

  const onFormChange = (form: RJSFSchema) => {
    if (form.schema.title === currentStep.schema.title) {
      setStepState(splitSchema, setSplitSchema, currentStep, { ...currentStep.state, ...form.formData })
    }
  }

  function handleListItemClick(index: number) {
    setActiveStep(index)
  }

  function handleOnClickListener(selection: QuestionSelection) {
    if (onQuestionClick) {
      onQuestionClick(selection)
    }
  }

  return (
    <Grid2 container spacing={2} sx={{ mt: 1 }}>
      <Grid2 size={{ xs: 12, md: 3 }} sx={{ borderRight: 1, borderColor: theme.palette.divider }}>
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
      </Grid2>
      <Grid2 size={{ xs: 12, md: 9 }}>
        <Form
          schema={currentStep.schema}
          formData={currentStep.state}
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
            onClickListener: handleOnClickListener,
            rootSection: currentStep.section,
          }}
          templates={{ DescriptionFieldTemplate, TitleFieldTemplate }}
        >
          <></>
        </Form>
      </Grid2>
    </Grid2>
  )
}
