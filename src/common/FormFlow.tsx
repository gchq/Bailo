import React, { useEffect, useMemo, useState } from 'react'
import { withTheme } from '@rjsf/core'
import { Theme as MaterialUITheme } from 'src/MuiForms'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Step from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Stepper from '@mui/material/Stepper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import omit from 'lodash/omit'
import get from 'lodash/get'
import dropRight from 'lodash/dropRight'
import remove from 'lodash/remove'
import UserSelector from '../MuiForms/UserSelector'
import { Validator } from 'jsonschema'
import FileInput from './FileInput'
import FormExport from './FormExport'

const Form = withTheme(MaterialUITheme)

function getSchemaSteps(schema: any, uiSchema: any, omitFields: any) {
  const schemaDupe = omit(schema, omitFields) as any

  for (let field of omitFields) {
    const fields = field.split('.')
    remove(get(schema, `${dropRight(fields, 2).join('.')}.required`, []), (v) => v === fields[fields.length - 1])
  }

  const props = Object.keys(schemaDupe.properties).filter((key) =>
    ['object', 'array'].includes(schemaDupe.properties[key].type)
  )
  return props.map((prop: any) => ({
    schema: {
      definitions: schemaDupe.definitions,
      ...schemaDupe.properties[prop],
    },
    title: schemaDupe.properties[prop].title,
    ui: uiSchema[prop],
    stepName: prop,
  }))
}

export default function FormFlow({
  schema,
  uiSchema,
  onSubmit,
  omitFields,
  name,
  mode,
  modelToEdit,
}: {
  schema: any
  onSubmit: any
  uiSchema: any
  omitFields: any
  name: any
  mode: any
  modelToEdit: any
}) {
  const [formData, setFormData] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [validationText, setValidationText] = useState('')
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState('')
  const [code, setCode] = useState(undefined)
  const [binary, setBinary] = useState(undefined)
  const [validatedSteps, setValidatedSteps] = useState<Array<number>>([])

  useEffect(() => {
    // When page loads, check if we need to edit an existing model
    if (modelToEdit !== undefined) {
      setFormData(modelToEdit.metadata)
    }    
  }, [modelToEdit])

  useEffect(() => {
    if (formData !== undefined && (mode === 'edit' || mode === 'newVersion')) {
      validateAllSteps()
    }
  }, [formData])
  
  const schemaSteps = useMemo(
    () => getSchemaSteps(schema.schema, uiSchema, omitFields),
    [schema.schema, uiSchema, omitFields]
  )

  useEffect(() => {
    validateStep()
    window.scrollTo(0, 0)
  }, [step])

  const onFormChange = (form: any) => {
    // This on change function is triggered by the form library when the form changes
    // Unfortuantely the form library seems to have an issue tracking the state changes
    // when switching betweent the steps.
    const curStep = schemaSteps.find((schemaStep: any) => schemaStep.title === form.schema.title)

    if (!curStep) {
      throw new Error('curStep failed to find current step')
    }

    setFormData({
      ...(formData || {}),
      [curStep.stepName]: form.formData,
    })
  }

  useEffect(() => {
    validateStep()
    setSubmissionErrorMessage('')
  }, [formData])

  const handleCodeChange = (e: any) => {
    setCode(e.target.files[0])
  }

  const handleBinaryChange = (e: any) => {
    setBinary(e.target.files[0])
  }

  useEffect(() => {
    validateAllSteps()
  }, [code, binary])

  const checkAllStepsValidated = () => {
    return validatedSteps.length === schemaSteps.length
  }

  const onFormSubmit = () => {
    setSubmissionErrorMessage('')
    if (step === schemaSteps.length - 1) {
      if (name === 'Model') {
        if (mode === 'edit') {
          if (checkAllStepsValidated()) {
            return onSubmit(formData, schema, { code, binary })
          } else {
            setSubmissionErrorMessage(
              'Please check that all steps are completed.'
            )
          }
        } else {          
          if (code !== undefined && binary !== undefined && checkAllStepsValidated()) {
            return onSubmit(formData, schema, { code, binary })
          } else {
            setSubmissionErrorMessage(
              'Please check that all steps are completed and that you have selected a valid code and binary file.'
            )
          }
        }
      } else {
        if (checkAllStepsValidated()) {
          return onSubmit(formData, schema, {})
        } else {
          setSubmissionErrorMessage('Please check that all steps are completed.')
        }
      }
    }
  }

  const currentFormData = formData === null ? null : (formData as any)[schemaSteps[step].stepName]

  const validateStep = () => {
    const validator = new Validator()
    const sectionErrors = validator.validate(currentFormData, schemaSteps[step].schema)

    const requiredFieldErrors: any = []
    sectionErrors.errors.forEach((error) => {
      if (error.name === 'required') {
        requiredFieldErrors.push(error)
      }
    })
    if (requiredFieldErrors.length > 0) {
      setValidationText('All required fields (*) should be filled out')
      setValidatedSteps(validatedSteps.filter((item) => item !== step))
    } else {
      setValidationText('')
      if (!validatedSteps.includes(step)) {
        setValidatedSteps((validatedSteps) => [...validatedSteps, step])
      }
    }
  }

  const validateAllSteps = () => {
    const validatedSteps = schemaSteps.reduce((acc: Array<number>, schemaStep: any, index: number) => {
      if (formData !== null) {
        const validator = new Validator()
        const sectionErrors = validator.validate((formData as any)[schemaSteps[index].stepName], schemaStep.schema)
        if (!sectionErrors.errors.length) {
          acc.push(index)
        } 
      }
      return acc
    }, [])
    setValidatedSteps(validatedSteps)
  }

  const handleNext = () => {
    validateStep()
    if (validatedSteps.includes(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setValidationText('')
    setStep(step - 1)
  }

  const submitButton = () => (
    <>
      <Box sx={{ textAlign: 'right' }}>
        <Button variant='contained' color='primary' onClick={onFormSubmit}>
          Submit
        </Button>
      </Box>
      {name === 'Model' && 
        <FormExport formData={formData} schema={schema} schemaSteps={schemaSteps} />
      }
    </>
  )

  return (
    <>
      {name === 'Model' && (
        <Box sx={{ pb: 4 }}>
          <Stack direction='row' spacing={2} alignItems='center'>
            <FileInput disabled={mode === 'edit'} label={'Select Code'} file={code} onChange={handleCodeChange} accepts=".zip" />
            <FileInput disabled={mode === 'edit'} label={'Select Binary'} file={binary} onChange={handleBinaryChange} accepts=".zip" />
          </Stack>
        </Box>
      )}
      <Stepper activeStep={step} nonLinear alternativeLabel>
        {schemaSteps.map((schemaStep: any, index: number) => (
          <Step key={schemaStep.schema.title}>
            <StepButton onClick={() => setStep(index)}>{schemaStep.schema.title}</StepButton>
            <Box sx={{ textAlign: 'center' }}>
              {validatedSteps.includes(index) ? (
                <Typography sx={{ color: 'green' }} variant='caption'>
                  Completed
                </Typography>
              ) : (
                <Typography sx={{ color: 'orange' }} variant='caption'>
                  In progress
                </Typography>
              )}
            </Box>
          </Step>
        ))}
      </Stepper>
      <Box sx={{ py: 1 }} />
      <Form
        schema={schemaSteps[step].schema}
        formData={currentFormData}
        onChange={onFormChange}
        onSubmit={onFormSubmit}
        widgets={{
          userSelector: UserSelector,
        }}
        uiSchema={schemaSteps[step].ui}
        // liveValidate
      >
        <>
          <Box sx={{ py: 1 }} />
          <Grid container justifyContent='space-between'>
            <Grid item>
              {step > 0 && (
                <Button variant='outlined' onClick={handlePrevious}>
                  Previous Section
                </Button>
              )}
            </Grid>
            <Grid item>
              {step < schemaSteps.length - 1 ? (
                <>
                  <Button variant='contained' onClick={handleNext}>
                    Next Section
                  </Button>
                </>
              ) : (
                submitButton()
              )}
            </Grid>
          </Grid>
          <Typography sx={{ pt: 2, color: 'red' }}>{validationText}</Typography>
          <Typography sx={{ pt: 2, color: 'red' }}>{submissionErrorMessage}</Typography>
        </>
      </Form>
    </>
  )
}
