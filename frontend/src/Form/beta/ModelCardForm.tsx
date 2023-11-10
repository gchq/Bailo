import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Stepper,
  Typography,
} from '@mui/material'
import Form from '@rjsf/mui'
import { ArrayFieldTemplateProps, RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { SplitSchemaNoRender } from '../../../types/interfaces'
import { setStepState } from '../../../utils/beta/formUtils'
import { widgets } from '../../../utils/formUtils'
import ValidationErrorIcon from '../../model/beta/common/ValidationErrorIcon'
import Nothing from '../../MuiForms/Nothing'

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  return (
    <div>
      <Typography fontWeight='bold' variant='h5' component='h3'>
        {props.title}
      </Typography>
      {props.items.map((element) => (
        <>
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
        </>
      ))}
      {props.canAdd && props.formContext.editMode && (
        <Button size='small' type='button' onClick={props.onAddClick} startIcon={<AddIcon />}>
          Add Item
        </Button>
      )}
    </div>
  )
}

function DescriptionFieldTemplate() {
  return <></>
}

// TODO - add validation BAI-866
export default function ModelCardForm({
  splitSchema,
  setSplitSchema,
  canEdit = false,
  displayLabelValidation = false,
}: {
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  canEdit?: boolean
  displayLabelValidation?: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)

  const router = useRouter()
  const formPage = router.query.formPage

  useEffect(() => {
    if (formPage) {
      const stepFromUrl = splitSchema.steps.find((step) => step.section === formPage)
      if (stepFromUrl) {
        setActiveStep(stepFromUrl.index)
      }
    }
  }, [formPage, splitSchema.steps])

  const currentStep = splitSchema.steps[activeStep]

  if (!currentStep) {
    return null
  }

  const onFormChange = (form: RJSFSchema) => {
    if (form.schema.title === currentStep.schema.title) {
      setStepState(splitSchema, setSplitSchema, currentStep, { ...currentStep.state, ...form.formData })
    }
  }

  function handleListItemClick(index: number, formPageKey: string) {
    setActiveStep(index)
    router.replace({
      query: { ...router.query, formPage: formPageKey },
    })
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ sm: 2 }}
      justifyContent='left'
      divider={<Divider flexItem orientation='vertical' />}
      sx={{ width: '100%' }}
    >
      <div>
        <Stepper
          activeStep={activeStep}
          nonLinear
          alternativeLabel
          orientation='vertical'
          connector={<Nothing />}
          sx={{ minWidth: 'max-content' }}
        >
          <List sx={{ width: { xs: '100%' } }}>
            {splitSchema.steps.map((step, index) => (
              <ListItem key={step.schema.title} disablePadding>
                <ListItemButton
                  selected={activeStep === index}
                  onClick={() => handleListItemClick(index, step.section)}
                >
                  <Stack direction='row' spacing={2}>
                    <Typography>{step.schema.title}</Typography>
                    {displayLabelValidation && <ValidationErrorIcon step={step} />}
                  </Stack>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stepper>
      </div>
      <Form
        schema={currentStep.schema}
        formData={currentStep.state}
        onChange={onFormChange}
        validator={validator}
        widgets={widgets}
        uiSchema={currentStep.uiSchema}
        liveValidate={currentStep.shouldValidate}
        omitExtraData
        disabled={!canEdit}
        liveOmit
        formContext={{ editMode: canEdit, formSchema: currentStep.schema }}
        templates={
          !canEdit
            ? {
                DescriptionFieldTemplate,
                ArrayFieldTemplate,
              }
            : { ArrayFieldTemplate }
        }
      >
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <></>
      </Form>
    </Stack>
  )
}
