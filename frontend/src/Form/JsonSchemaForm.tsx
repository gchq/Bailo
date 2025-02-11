import { Grid2, List, ListItem, ListItemButton, Stepper, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Form from '@rjsf/mui'
import { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { Dispatch, SetStateAction, useState } from 'react'
import { ArrayFieldTemplate, DescriptionFieldTemplate, ObjectFieldTemplate } from 'src/Form/FormTemplates'
import ValidationErrorIcon from 'src/Form/ValidationErrorIcon'
import Nothing from 'src/MuiForms/Nothing'
import { SplitSchemaNoRender } from 'types/types'
import { setStepState, widgets } from 'utils/formUtils'

// TODO - add validation BAI-866
export default function JsonSchemaForm({
  splitSchema,
  setSplitSchema,
  canEdit = false,
  displayLabelValidation = false,
  defaultCurrentUserInEntityList = false,
  editedFields = [],
  setEditedFields,
}: {
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  canEdit?: boolean
  displayLabelValidation?: boolean
  defaultCurrentUserInEntityList?: boolean
  editedFields?: Array<string>
  setEditedFields?: Dispatch<SetStateAction<string[]>>
}) {
  const [activeStep, setActiveStep] = useState(0)
  // const [test, setTest] = useState<{ [key: string]: string }>({})
  const theme = useTheme()

  const currentStep = splitSchema.steps[activeStep]

  if (!currentStep) {
    return null
  }

  const onFormChange = (form: RJSFSchema, id?: string) => {
    if (id && currentStep && !!setEditedFields && !editedFields.includes(id)) {
      //store section and use alongside the id, it will fix our dimensions issue
      setTest((test, currentStep, id) => {
        test[currentStep.section] = id
      })
      setEditedFields!([...editedFields, id])
    }

    if (form.schema.title === currentStep.schema.title) {
      setStepState(splitSchema, setSplitSchema, currentStep, { ...currentStep.state, ...form.formData })
    }
  }

  function handleListItemClick(index: number) {
    setActiveStep(index)
  }

  function ErrorListTemplate() {
    return (
      <Typography color={theme.palette.error.main} sx={{ mb: 2 }}>
        Please make sure that all errors listed below have been resolved.
      </Typography>
    )
  }

  return (
    <Grid2 container spacing={2} sx={{ mt: 1 }}>
      <Grid2 size={{ xs: 12, md: 2 }} sx={{ borderRight: 1, borderColor: theme.palette.divider }}>
        <Stepper activeStep={activeStep} nonLinear alternativeLabel orientation='vertical' connector={<Nothing />}>
          <List sx={{ width: { xs: '100%' } }}>
            {splitSchema.steps.map((step, index) => (
              <ListItem key={step.schema.title} disablePadding sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
      </Grid2>
      <Grid2 size={{ xs: 12, md: 10 }}>
        <Form
          schema={currentStep.schema}
          formData={currentStep.state}
          onChange={(data, id) => onFormChange(data, id)}
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
          }}
          templates={
            !canEdit
              ? {
                  DescriptionFieldTemplate,
                  ArrayFieldTemplate,
                  ObjectFieldTemplate,
                }
              : {
                  ArrayFieldTemplate,
                  ObjectFieldTemplate,
                  ErrorListTemplate,
                }
          }
        >
          {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
          <></>
        </Form>
      </Grid2>
    </Grid2>
  )
}
