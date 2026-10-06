import { Alert, TextField } from '@mui/material'
import { postDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetModels } from 'actions/entry'
import { useGetSchema } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { ChangeEvent, useContext, useEffect, useMemo, useState } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Title from 'src/common/Title'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import SchemaFormPage from 'src/schemas/SchemaFormPage'
import SchemaSelect from 'src/schemas/SchemaSelect'
import { SchemaKind, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema, removeEmptyValues, setStepValidate, validateForm } from 'utils/formUtils'

export default function NewDeploymentAssessment() {
  const router = useRouter()
  const { schemaId: rawSchemaId, preselectedModelId: rawModelId } = router.query
  const schemaId = Array.isArray(rawSchemaId) ? rawSchemaId[0] : rawSchemaId
  const modelIds = useMemo(
    () => (rawModelId ? (Array.isArray(rawModelId) ? rawModelId : [rawModelId]) : []),
    [rawModelId],
  )

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId || '')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { models, failedModelIds, isModelsLoading, isModelsError } = useGetModels(modelIds)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [name, setName] = useState('')
  const [errorText, setErrorText] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  const [draftButtonLoading, setDraftButtonLoading] = useState(false)
  const [formValidationErrorState, setFormValidationErrorState] = useState(false)

  const isFormLoading = useMemo(
    () => isSchemaLoading || isCurrentUserLoading || isModelsLoading,
    [isSchemaLoading, isCurrentUserLoading, isModelsLoading],
  )

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  useEffect(() => {
    if (!schema || !currentUser) {
      return
    }

    const defaultState = modelIds.length > 0 ? { modelOverview: { modelIds } } : {}
    const steps = getStepsFromSchema(schema, {}, [], defaultState)
    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, currentUser, modelIds])

  // Picking a different schema starts a new form, so stop highlighting errors until it is submitted
  useEffect(() => {
    setFormValidationErrorState(false)
  }, [schemaId])

  async function onSaveDraft() {
    setErrorText('')
    setDraftButtonLoading(true)
    setUnsavedChanges(false)

    if (!schemaId) {
      setErrorText('Please wait until the page has finished loading before attempting to save.')
      setDraftButtonLoading(false)
      return
    }

    const data = getStepsData(splitSchema, true)
    const res = await postDeploymentAssessment(name, schemaId, removeEmptyValues(data), true)

    if (!res.ok) {
      setErrorText(await getErrorMessage(res))
      setDraftButtonLoading(false)
      return
    }

    setDraftButtonLoading(false)

    const body = await res.json()
    router.push(`/deployment-assessments/${body.deploymentAssessment.id}`)
  }

  async function onSubmit() {
    setErrorText('')
    setSubmitButtonLoading(true)
    setUnsavedChanges(false)
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

    const body = await res.json()
    router.push(`/deployment-assessments/${body.deploymentAssessment.id}`)
  }

  useEffect(() => {
    if (schemaId) {
      setUnsavedChanges(true)
    }
  }, [schemaId, setUnsavedChanges])

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
      backHref={(() => {
        const params = new URLSearchParams()
        modelIds.forEach((id) => params.append('preselectedModelId', id))
        const qs = params.toString()
        return qs ? `/deployment-assessments/new?${qs}` : '/deployment-assessments/new'
      })()}
      backLabel='Select a different schema'
      onSubmit={onSubmit}
      submitButtonLoading={submitButtonLoading}
      formValidationErrorState={formValidationErrorState}
      errorText={errorText}
      onSaveDraft={onSaveDraft}
      draftButtonLoading={draftButtonLoading}
      disableActions={!name ? 'Please enter a deployment assessment name' : undefined}
    >
      {isModelsError && (
        <Alert severity='error' sx={{ mb: 2 }}>
          The following model ID(s) supplied in the URL could not be loaded:{' '}
          <strong>{failedModelIds.join(', ')}</strong>. The model(s) may not exist or you may not have permission to
          access them. Any valid models have still been pre-filled in the form.
        </Alert>
      )}
      {!isModelsError && models.length > 0 && (
        <Alert severity='info' sx={{ mb: 2 }}>
          This assessment will be linked to <strong>{models.map((m) => m.name).join(', ')}</strong>. The{' '}
          {models.length === 1 ? 'model has' : 'models have'} been pre-filled in the form.
        </Alert>
      )}
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
