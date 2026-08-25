import { TextField } from '@mui/material'
import { postDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetSchema } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import SchemaFormPage from 'src/schemas/SchemaFormPage'
import SchemaSelect from 'src/schemas/SchemaSelect'
import { SchemaKind, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema, setStepValidate, validateForm } from 'utils/formUtils'

export default function NewDeploymentAssessment() {
  const router = useRouter()
  const { schemaId }: { schemaId?: string } = router.query

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId || '')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [name, setName] = useState('')
  const [errorText, setErrorText] = useState('')
  const [draftSuccessText, setDraftSuccessText] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  const [draftButtonLoading, setDraftButtonLoading] = useState(false)
  const [formValidationErrorState, setFormValidationErrorState] = useState(false)

  const isFormLoading = useMemo(() => isSchemaLoading || isCurrentUserLoading, [isSchemaLoading, isCurrentUserLoading])

  useEffect(() => {
    if (!schema || !currentUser) {
      return
    }

    const steps = getStepsFromSchema(schema)
    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, currentUser])

  async function onSaveDraft() {
    setErrorText('')
    setDraftSuccessText('')
    setDraftButtonLoading(true)

    if (!schemaId) {
      setErrorText('Please wait until the page has finished loading before attempting to save.')
      setDraftButtonLoading(false)
      return
    }

    const data = getStepsData(splitSchema, true)
    const res = await postDeploymentAssessment(name, schemaId, data, true)

    if (!res.ok) {
      setErrorText(await getErrorMessage(res))
      setDraftButtonLoading(false)
      return
    }

    setDraftSuccessText('Draft saved successfully.')
    setDraftButtonLoading(false)
  }

  async function onSubmit() {
    setErrorText('')
    setDraftSuccessText('')
    setSubmitButtonLoading(true)
    setFormValidationErrorState(false)

    if (!schemaId) {
      setErrorText('Please wait until the page has finished loading before attempting to submit.')
      setSubmitButtonLoading(false)
      return
    }

    for (const step of splitSchema.steps) {
      setStepValidate(splitSchema, setSplitSchema, step, true)
    }

    for (const step of splitSchema.steps) {
      const isValid = validateForm(step)

      if (!isValid) {
        setErrorText('Please make sure that all sections have been completed.')
        setSubmitButtonLoading(false)
        setFormValidationErrorState(true)
        return
      }
    }

    const data = getStepsData(splitSchema, true)
    const res = await postDeploymentAssessment(name, schemaId, data, false)

    if (!res.ok) {
      setErrorText(await getErrorMessage(res))
      setSubmitButtonLoading(false)
      return
    }

    router.push('/deployment-assessments')
  }

  const error = MultipleErrorWrapper('Unable to load deployment assessment page', {
    isSchemaError,
    isCurrentUserError,
  })
  if (error) {
    return error
  }

  if (!schemaId) {
    return (
      <>
        <Title text='Select a schema' />
        <SchemaSelect schemaKind={SchemaKind.DEPLOYMENT_ASSESSMENT} />
      </>
    )
  }

  return (
    <SchemaFormPage
      title='New Deployment Assessment'
      isLoading={isFormLoading}
      splitSchema={splitSchema}
      setSplitSchema={setSplitSchema}
      backHref='/deployment-assessments/new'
      backLabel='Select a different schema'
      onSubmit={onSubmit}
      submitButtonLoading={submitButtonLoading}
      formValidationErrorState={formValidationErrorState}
      errorText={errorText}
      onSaveDraft={onSaveDraft}
      draftButtonLoading={draftButtonLoading}
      draftSuccessText={draftSuccessText}
      disableActions={!name ? 'Please enter a deployment assessment name' : undefined}
    >
      <LabelledInput fullWidth label='Deployment Assessment Name' htmlFor='deployment-assessment-name'>
        <TextField
          fullWidth
          size='small'
          id='deployment-assessment-name'
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />
      </LabelledInput>
    </SchemaFormPage>
  )
}
