import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import {
  Box,
  Button,
  Card,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Stepper,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Form from '@rjsf/mui'
import { ArrayFieldTemplateProps, ObjectFieldTemplateProps, RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import ValidationErrorIcon from 'src/entry/model/common/ValidationErrorIcon'
import Nothing from 'src/MuiForms/Nothing'
import { SplitSchemaNoRender } from 'types/types'
import { setStepState, widgets } from 'utils/formUtils'

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography fontWeight='bold' variant='h5' component='h3'>
        {props.title}
      </Typography>
      {props.items.map((element) => (
        <Grid key={element.key} container spacing={2}>
          <Grid item xs={11}>
            <Box>{element.children}</Box>
          </Grid>
          <Grid item xs={1}>
            {props.formContext.editMode && (
              <IconButton size='small' type='button' onClick={element.onDropIndexClick(element.index)}>
                <RemoveIcon color='error' />
              </IconButton>
            )}
          </Grid>
        </Grid>
      ))}
      {props.canAdd && props.formContext.editMode && (
        <Button size='small' type='button' onClick={props.onAddClick} startIcon={<AddIcon />}>
          Add Item
        </Button>
      )}
    </Card>
  )
}

function DescriptionFieldTemplate() {
  return <></>
}

function ObjectFieldTemplate({ title, properties, description }: ObjectFieldTemplateProps) {
  return (
    <Box sx={{ pl: 2, mb: 3 }}>
      <Stack spacing={2}>
        <div>
          <Typography fontWeight='bold' variant='h6' component='h3'>
            {title}
          </Typography>
          <Typography variant='caption'>{description}</Typography>
        </div>
        {properties.map((element) => (
          <div key={element.name} className='property-wrapper'>
            {element.content}
          </div>
        ))}
      </Stack>
    </Box>
  )
}

// TODO - add validation BAI-866
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
  const [firstQuestionKey, setFirstQuestionKey] = useState<string | undefined>()
  const theme = useTheme()

  const currentStep = splitSchema.steps[activeStep]

  const getKeyFromSection = useCallback((schema: RJSFSchema, key: string) => {
    const [firstQuestionKey] = Object.keys(schema)
    let updatedKey = `${key}_${firstQuestionKey}`
    if (schema[firstQuestionKey].type === 'object') {
      updatedKey = getKeyFromSection(schema[firstQuestionKey].properties, updatedKey)
    }
    return updatedKey
  }, [])

  useEffect(() => {
    // Set focus to first question in current step
    if (currentStep) {
      setFirstQuestionKey(getKeyFromSection(currentStep.schema.properties, 'root'))
    }
  }, [currentStep, getKeyFromSection])

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
  }

  function ErrorListTemplate() {
    return (
      <Typography color={theme.palette.error.main} sx={{ mb: 2 }}>
        Please make sure that all errors listed below have been resolved.
      </Typography>
    )
  }

  return (
    <Grid container spacing={2} sx={{ mt: theme.spacing(1) }}>
      <Grid item xs={12} sm={3} md={2} sx={{ borderRight: 1, borderColor: theme.palette.divider }}>
        <Stepper activeStep={activeStep} nonLinear alternativeLabel orientation='vertical' connector={<Nothing />}>
          <List sx={{ width: { xs: '100%' } }}>
            {splitSchema.steps.map((step, index) => (
              <ListItem key={step.schema.title} disablePadding>
                <ListItemButton selected={activeStep === index} onClick={() => handleListItemClick(index)}>
                  <Stack direction='row' spacing={2}>
                    <Typography>{step.schema.title}</Typography>
                    {displayLabelValidation && <ValidationErrorIcon step={step} />}
                  </Stack>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stepper>
      </Grid>
      <Grid item xs={12} sm={9} md={10}>
        {firstQuestionKey && (
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
              firstQuestionKey: firstQuestionKey,
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
        )}
      </Grid>
    </Grid>
  )
}
