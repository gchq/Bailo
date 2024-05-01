import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { putModelCard, useGetModelCardRevisions } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { useContext, useEffect, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import TextInputDialog from 'src/common/TextInputDialog'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EntryCardHistoryDialog from 'src/entry/overview/EntryCardHistoryDialog'
import SaveAndCancelButtons from 'src/entry/overview/SaveAndCancelFormButtons'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, SplitSchemaNoRender } from 'types/types'
import { getStepsData, getStepsFromSchema } from 'utils/formUtils'

type FormEditPageProps = {
  entry: EntryInterface
}

export default function FormEditPage({ entry }: FormEditPageProps) {
  const [isEdit, setIsEdit] = useState(false)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [errorMessage, setErrorMessage] = useState('')

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entry.card.schemaId)
  const { isModelError, mutateModel } = useGetModel(entry.id)
  const { mutateModelCardRevisions } = useGetModelCardRevisions(entry.id)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [jsonUploadDialogOpen, setJsonUploadDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const sendNotification = useNotification()
  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  async function onSubmit() {
    if (schema) {
      setErrorMessage('')
      setLoading(true)
      const data = getStepsData(splitSchema, true)
      const res = await putModelCard(entry.id, data)
      if (res.status && res.status < 400) {
        setIsEdit(false)
        mutateModelCardRevisions()
      } else {
        setErrorMessage(res.data)
      }
      setLoading(false)
    }
  }

  function onCancel() {
    if (schema) {
      mutateModel()
      const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], entry.card.metadata)
      for (const step of steps) {
        step.steps = steps
      }
      setSplitSchema({ reference: schema.id, steps })
      setIsEdit(false)
    }
  }

  useEffect(() => {
    if (!entry || !schema) return
    const metadata = entry.card.metadata
    const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], metadata)

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, entry])

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  function handleJsonFormOnSubmit(formData: string) {
    setJsonUploadDialogOpen(false)
    try {
      if (schema) {
        const steps = getStepsFromSchema(schema, {}, [], JSON.parse(formData))
        for (const step of steps) {
          step.steps = steps
        }
        setSplitSchema({ reference: schema.id, steps })
      }
    } catch (_e) {
      sendNotification({
        variant: 'error',
        msg: 'Could not update form - please make sure to use valid JSON.',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  return (
    <>
      {isSchemaLoading && <Loading />}
      <Box sx={{ py: 1 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent={{ xs: 'center', sm: 'space-between' }}
          alignItems='center'
          sx={{ pb: 2 }}
        >
          <div>
            <Typography fontWeight='bold'>Schema</Typography>
            <Stack direction='row' alignItems='center'>
              <Typography>{schema?.name}</Typography>
              <CopyToClipboardButton
                textToCopy={schema ? schema.name : ''}
                notificationText='Copied schema name to clipboard'
                ariaLabel='copy schema name to clipboard'
              />
            </Stack>
          </div>
          {!isEdit && (
            <Stack
              direction='row'
              spacing={1}
              justifyContent='flex-end'
              divider={<Divider orientation='vertical' flexItem />}
              sx={{ mb: { xs: 2 } }}
            >
              <Button variant='outlined' onClick={() => setHistoryDialogOpen(true)}>
                View History
              </Button>
              <Button
                variant='outlined'
                onClick={() => setIsEdit(!isEdit)}
                sx={{ mb: { xs: 2 } }}
                data-test='editModelCardButton'
              >
                Edit Model card
              </Button>
            </Stack>
          )}
          {isEdit && (
            <SaveAndCancelButtons
              onCancel={onCancel}
              onSubmit={onSubmit}
              openTextInputDialog={() => setJsonUploadDialogOpen(true)}
              loading={loading}
              cancelDataTestId='cancelEditModelCardButton'
              saveDataTestId='saveModelCardButton'
            />
          )}
        </Stack>
        <MessageAlert message={errorMessage} severity='error' />
        <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={isEdit} />
        {isEdit && (
          <SaveAndCancelButtons
            onCancel={onCancel}
            onSubmit={onSubmit}
            loading={loading}
            openTextInputDialog={() => setJsonUploadDialogOpen(true)}
          />
        )}
      </Box>
      <EntryCardHistoryDialog entry={entry} open={historyDialogOpen} setOpen={setHistoryDialogOpen} />
      <TextInputDialog
        open={jsonUploadDialogOpen}
        setOpen={setJsonUploadDialogOpen}
        onSubmit={handleJsonFormOnSubmit}
        helperText='Paste in raw JSON to fill in the model card form'
        dialogTitle='Add raw JSON to form'
      />
    </>
  )
}
