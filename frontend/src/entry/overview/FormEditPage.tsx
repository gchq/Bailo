import { Box, Button, Stack, Tooltip, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { putModelCard, useGetModelCardRevisions } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { useContext, useEffect, useMemo, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import TextInputDialog from 'src/common/TextInputDialog'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EntryCardHistoryDialog from 'src/entry/overview/EntryCardHistoryDialog'
import ExportModelCardDialog from 'src/entry/overview/ExportModelCardDialog'
import SaveAndCancelButtons from 'src/entry/overview/SaveAndCancelFormButtons'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryCardKindLabel, EntryInterface, SplitSchemaNoRender } from 'types/types'
import { getStepsData, getStepsFromSchema } from 'utils/formUtils'
import { getRequiredRolesText, hasRole } from 'utils/roles'

type FormEditPageProps = {
  entry: EntryInterface
  readOnly?: boolean
  currentUserRoles: string[]
}

export default function FormEditPage({ entry, currentUserRoles, readOnly = false }: FormEditPageProps) {
  const [isEdit, setIsEdit] = useState(false)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [errorMessage, setErrorMessage] = useState('')

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entry.card.schemaId)
  const { isModelError: isEntryError, mutateModel: mutateEntry } = useGetModel(entry.id, entry.kind)
  const { mutateModelCardRevisions: mutateEntryCardRevisions } = useGetModelCardRevisions(entry.id)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [jsonUploadDialogOpen, setJsonUploadDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const sendNotification = useNotification()
  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  const [canEdit, requiredRolesText] = useMemo(() => {
    const validRoles = ['owner', 'contributor']
    return [hasRole(currentUserRoles, validRoles), getRequiredRolesText(currentUserRoles, validRoles)]
  }, [currentUserRoles])

  async function onSubmit() {
    if (schema) {
      setErrorMessage('')
      setLoading(true)
      const data = getStepsData(splitSchema, true)
      const res = await putModelCard(entry.id, data)
      if (res.status && res.status < 400) {
        setIsEdit(false)
        mutateEntryCardRevisions()
      } else {
        setErrorMessage(res.data)
      }
      setLoading(false)
    }
  }

  function onCancel() {
    if (schema) {
      mutateEntry()
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

  if (isEntryError) {
    return <MessageAlert message={isEntryError.info.message} severity='error' />
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
            <Stack direction='row' spacing={1} justifyContent='flex-end' sx={{ mb: { xs: 2 } }}>
              <Button variant='outlined' onClick={() => setExportDialogOpen(true)}>
                Export as PDF
              </Button>
              <Button variant='outlined' onClick={() => setHistoryDialogOpen(true)}>
                View History
              </Button>
              {!readOnly && (
                <Tooltip title={requiredRolesText}>
                  <span>
                    <Button
                      variant='outlined'
                      disabled={!canEdit}
                      onClick={() => setIsEdit(!isEdit)}
                      data-test='editEntryCardButton'
                    >
                      {`Edit ${EntryCardKindLabel[entry.kind]}`}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Stack>
          )}
          {isEdit && (
            <SaveAndCancelButtons
              onCancel={onCancel}
              onSubmit={onSubmit}
              openTextInputDialog={() => setJsonUploadDialogOpen(true)}
              loading={loading}
              cancelDataTestId='cancelEditEntryCardButton'
              saveDataTestId='saveEntryCardButton'
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
        onClose={() => setJsonUploadDialogOpen(false)}
        onSubmit={handleJsonFormOnSubmit}
        helperText={`Paste in raw JSON to fill in the ${EntryCardKindLabel[entry.kind]} form`}
        dialogTitle='Add Raw JSON to Form'
      />
      <ExportModelCardDialog
        entry={entry}
        splitSchema={splitSchema}
        open={exportDialogOpen}
        setOpen={setExportDialogOpen}
      />
    </>
  )
}
